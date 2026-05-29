using Microsoft.EntityFrameworkCore;
using Web.Application.Interfaces;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class AccessRequestService : IAccessRequestService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;

    public AccessRequestService(
        AppDbContext db,
        INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<AccessRequestDto> SubmitAsync(SubmitAccessRequestDto request)
    {
        if (!request.IsAgreed)
            throw new InvalidOperationException("User must agree before submitting the request.");

        if (request.Items.Count == 0)
            throw new InvalidOperationException("At least one folder access item is required.");

        var requester = await _db.CmplUsers.FindAsync(request.UserId);
        if (requester is null)
            throw new InvalidOperationException("Request user was not found.");

        var now = DateTime.UtcNow;
        var nextSequence = await GetNextTicketSequenceAsync(now.Year);
        var requestEntity = new AccessRequestEntity
        {
            UserId = request.UserId,
            IsAgreed = request.IsAgreed,
            ItsrNo = request.ItsrNo?.Trim(),
            CurrentStatus = RequestStatus.PendingWithHod,
            RequestedAtUtc = now,
            LastActionAtUtc = now
        };

        var createdItems = new List<AccessItemEntity>();

        foreach (var item in request.Items)
        {
            var folderPath = RequestWorkflowSupport.NormalizeFolderPath(item.FolderPath);
            var hodApproverId = await RequestWorkflowSupport.ResolveMappedHodApproverAsync(
                _db,
                request.UserId,
                folderPath);

            if (hodApproverId is null)
                throw new InvalidOperationException($"No HOD mapping found for folder path '{folderPath}'.");

            var ticketNumber = $"REQ-{now.Year}-{nextSequence:000}";
            nextSequence++;

            createdItems.Add(new AccessItemEntity
            {
                TicketNumber = ticketNumber,
                Status = RequestStatus.PendingWithHod,
                FolderPath = folderPath,
                AccessType = item.AccessType,
                ConfirmAccessType = item.ConfirmAccessType,
                Reason = item.Reason.Trim(),
                HodApproverId = hodApproverId,
                RequestedAtUtc = now,
                LastActionAtUtc = now
            });
        }

        requestEntity.ReqTo = createdItems.First().HodApproverId ?? 0;
        requestEntity.CurrentApproverId = createdItems.First().HodApproverId;
        requestEntity.AccessItems = createdItems;

        _db.AccessRequests.Add(requestEntity);
        await _db.SaveChangesAsync();

        var recipientIds = createdItems
            .Select(i => i.HodApproverId)
            .OfType<int>()
            .Distinct()
            .ToList();

        await _notificationService.SendStageNotificationAsync(
            requestEntity.AccessReqId,
            null,
            "RequestSubmitted",
            $"Access request {requestEntity.AccessReqId} has been submitted and moved to HOD cart.",
            new[] { request.UserId });

        await _notificationService.SendStageNotificationAsync(
            requestEntity.AccessReqId,
            null,
            "PendingWithHod",
            $"Access request {requestEntity.AccessReqId} is waiting for your approval.",
            recipientIds,
            request.UserId);

        return (await RequestWorkflowSupport.BuildRequestDtoAsync(_db, requestEntity.AccessReqId))!;
    }

    public async Task<IReadOnlyList<AccessRequestDto>> GetAllAsync(int? userId = null)
    {
        var query = _db.AccessRequests.AsQueryable();

        if (userId is not null)
            query = query.Where(r => r.UserId == userId.Value);

        var requestIds = await query
            .OrderByDescending(r => r.RequestedAtUtc)
            .Select(r => r.AccessReqId)
            .ToListAsync();

        var results = new List<AccessRequestDto>(requestIds.Count);

        foreach (var requestId in requestIds)
        {
            var dto = await RequestWorkflowSupport.BuildRequestDtoAsync(_db, requestId);
            if (dto is not null)
                results.Add(dto);
        }

        return results;
    }

    public Task<AccessRequestDto?> GetByIdAsync(int accessReqId) =>
        RequestWorkflowSupport.BuildRequestDtoAsync(_db, accessReqId);

    public async Task<IReadOnlyList<AccessRequestDto>> GetPendingHodCartAsync(int approverId)
    {
        var requestIds = await _db.AccessItems
            .Where(i => i.Status == RequestStatus.PendingWithHod && i.HodApproverId == approverId)
            .Select(i => i.AccessReqId)
            .Distinct()
            .ToListAsync();

        var results = new List<AccessRequestDto>(requestIds.Count);

        foreach (var requestId in requestIds)
        {
            var dto = await RequestWorkflowSupport.BuildRequestDtoAsync(_db, requestId);
            if (dto is not null)
                results.Add(dto);
        }

        return results;
    }

    public async Task<IReadOnlyList<AccessRequestDto>> GetPendingItCartAsync()
    {
        var requestIds = await _db.AccessItems
            .Where(i => i.Status == RequestStatus.PendingWithIt)
            .Select(i => i.AccessReqId)
            .Distinct()
            .ToListAsync();

        var results = new List<AccessRequestDto>(requestIds.Count);

        foreach (var requestId in requestIds)
        {
            var dto = await RequestWorkflowSupport.BuildRequestDtoAsync(_db, requestId);
            if (dto is not null)
                results.Add(dto);
        }

        return results;
    }

    private async Task<int> GetNextTicketSequenceAsync(int year)
    {
        var prefix = $"REQ-{year}-";
        var existing = await _db.AccessItems
            .Where(i => i.TicketNumber.StartsWith(prefix))
            .Select(i => i.TicketNumber)
            .ToListAsync();

        var maxSequence = 0;

        foreach (var ticket in existing)
        {
            var sequencePart = ticket[prefix.Length..];
            if (int.TryParse(sequencePart, out var parsed))
                maxSequence = Math.Max(maxSequence, parsed);
        }

        return maxSequence + 1;
    }
}

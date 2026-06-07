using global::Server.Core.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Server.Core.Domain.Dto;

// =======================================================================================
// STAGE 0: REQUEST SUBMISSION ENVELOPES
// =======================================================================================

/// <summary>
/// Input DTO used when an employee submits a new batch access cart.
/// </summary>
public sealed class CreateRequestDto
{
    [Required(ErrorMessage = "At least one folder resource access item must be included in the submission bundle.")]
    [MinLength(1, ErrorMessage = "An access batch must contain at least one folder item allocation.")]
    public List<RequestedFolderItemDto> Items { get; set; } = [];

    [Required(ErrorMessage = "You must confirm agreement to the request terms.")]
    public bool? IsAgreed { get; set; }

    [Required(ErrorMessage = "ITSR number is required.")]
    [StringLength(50, MinimumLength = 5, ErrorMessage = "ITSR number must be between 5 and 50 characters.")]
    public string ItsrNo { get; set; } = string.Empty;
}

/// <summary>
/// Input DTO representing a single targeted folder item within a batch submission cart.
/// </summary>
public sealed class RequestedFolderItemDto
{
    [Required(ErrorMessage = "Folder share pathway string is required.")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Folder path string must be between 5 and 500 characters.")]
    [RegularExpression(@"^\\{2}.+$", ErrorMessage = "Security Format Guard: Folder path must utilize valid enterprise share naming conventions beginning with double backslashes (\\\\).")]
    public string FolderPath { get; set; } = string.Empty;

    [Required(ErrorMessage = "Target permission access type configuration scope is required.")]
    [EnumDataType(typeof(AccessTypes), ErrorMessage = "Invalid authorization permission level flag provided.")]
    public AccessTypes AccessType { get; set; }

    [Required(ErrorMessage = "Business reason justification text is mandatory for corporate data audits.")]
    [StringLength(250, MinimumLength = 10, ErrorMessage = "Business justification details must be between 10 and 250 characters.")]
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Structured corporate JSON response object sent back upon successful batch registration.
/// </summary>
public sealed class RequestCreationResponseDto
{
    public int MasterRequestId { get; set; }
    public string Message { get; set; } = "Multi-item request batch initialized successfully.";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}


// =======================================================================================
// STAGE 1: GOVERNANCE SIGN-OFF ENVELOPES
// =======================================================================================

/// <summary>
/// Input DTO for HOD or Folder Owner evaluation checkpoints.
/// </summary>
public sealed class ProcessApprovalDto
{
    [Required(ErrorMessage = "An explicit workflow evaluation decision status is required.")]
    [EnumDataType(typeof(RequestStatus), ErrorMessage = "Decision parameter must evaluate exclusively to Approved (1) or Rejected (2).")]
    public RequestStatus Decision { get; set; }

    [Required(ErrorMessage = "Evaluator assessment comments or tracking notes are required.")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Comments must be between 5 and 500 characters to provide historical auditing transparency.")]
    public string Comments { get; set; } = string.Empty;
}


// =======================================================================================
// STAGE 2: IT INFRASTRUCTURE DEPLOYMENT ENVELOPES
// =======================================================================================

/// <summary>
/// Input DTO for IT Desk agents finalizing network directory mapping privileges.
/// </summary>
public sealed class FinalizeProvisioningDto
{
    [Required(ErrorMessage = "Final closeout resolution metric execution flag is required.")]
    [EnumDataType(typeof(RequestStatus), ErrorMessage = "Closeout parameter must evaluate exclusively to Completed (4) or Rejected (2).")]
    public RequestStatus FinalDecision { get; set; }

    [Required(ErrorMessage = "The final confirmed access parameter mapping type is required.")]
    [EnumDataType(typeof(AccessTypes), ErrorMessage = "Invalid physical layout permission configuration flag choice provided.")]
    public AccessTypes ConfirmedAccessType { get; set; }

    [Required(ErrorMessage = "IT infrastructure deployment notes or technical closeout remarks are required.")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Technical logs and metrics comments must be between 5 and 500 characters.")]
    public string OperationalComments { get; set; } = string.Empty;
}


// =======================================================================================
// STAGE 3: AD-HOC LIFECYCLE DESTRUCTION & CYCLE RECOVERY ENVELOPES
// =======================================================================================

/// <summary>
/// Input DTO used when an IT administrator force-terminates active permissions prematurely.
/// </summary>
public sealed class RevokeAccessDto
{
    [Required(ErrorMessage = "A valid regulatory or security compliance reason must be logged for manual access revocation.")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "Revocation justification reason text must be between 10 and 500 characters.")]
    public string RevocationReason { get; set; } = string.Empty;
}

/// <summary>
/// Input DTO allowing an employee to alter their justification when recycling a failed ticket.
/// </summary>
public sealed class ResubmitRequestDto
{
    [StringLength(250, MinimumLength = 10, ErrorMessage = "If updating the business case justification text, it must be between 10 and 250 characters.")]
    public string? UpdatedReason { get; set; }
}

/// <summary>
/// Flat read model returned by all query methods for access request summaries.
/// Combines master request metadata with individual line-item details.
/// </summary>
public sealed class AccessRequestSummaryDto
{
    public int            AccessItemId        { get; init; }
    public int            AccessReqId         { get; init; }
    public string         TicketNumber        { get; init; } = string.Empty;
    public int            RequesterUserId     { get; init; }
    public string         RequesterName       { get; init; } = string.Empty;
    public string         FolderPath          { get; init; } = string.Empty;
    public AccessTypes    AccessType          { get; init; }
    public AccessTypes    ConfirmedAccessType { get; init; }
    public string         Reason              { get; init; } = string.Empty;
    public RequestStatus  Status              { get; init; }
    public DateTime?      AccessFrom          { get; init; }
    public DateTime?      AccessTo            { get; init; }
    public DateTime?      RevokedOn           { get; init; }
    public DateTime       CreatedOn           { get; init; }
    public int? DaysRemaining => AccessTo.HasValue && Status == RequestStatus.Completed
        ? Math.Max(0, (int)(AccessTo.Value - DateTime.UtcNow).TotalDays)
        : null;
}

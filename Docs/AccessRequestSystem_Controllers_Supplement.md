# Access Request System — Supplementary Controllers Guide

> **This document is a supplement** to `AccessRequestSystem_Implementation.md`.
> Covers the four missing areas: **Auth**, **Users**, **Departments**, and **FolderMappings**.
> Your existing uploaded files are not modified.

---

## Table of Contents

1. [Project Structure Additions](#1-project-structure-additions)
2. [Auth Service & Controller](#2-auth-service--controller)
3. [User Service & Controller](#3-user-service--controller)
4. [Department Service & Controller](#4-department-service--controller)
5. [FolderMapping Service & Controller](#5-foldermapping-service--controller)
6. [New DTOs](#6-new-dtos)
7. [JWT Helper](#7-jwt-helper)
8. [Program.cs Additions](#8-programcs-additions)
9. [Role-based Endpoint Access Summary](#9-role-based-endpoint-access-summary)

---

## 1. Project Structure Additions

```
Web/
├── Application/
│   └── Services/
│       ├── IAuthService.cs               ← NEW
│       ├── AuthService.cs                ← NEW
│       ├── IUserService.cs               ← NEW
│       ├── UserService.cs                ← NEW
│       ├── IDepartmentService.cs         ← NEW
│       ├── DepartmentService.cs          ← NEW
│       ├── IFolderMappingService.cs      ← NEW
│       └── FolderMappingService.cs       ← NEW
├── Infrastructure/
│   └── Utilities/
│       └── JwtTokenGenerator.cs          ← NEW
└── API/
    └── Controllers/
        ├── AuthController.cs             ← NEW
        ├── UsersController.cs            ← NEW
        ├── DepartmentsController.cs      ← NEW
        └── FolderMappingsController.cs   ← NEW
```

---

## 2. Auth Service & Controller

### Rules

- Login resolves from `CmplUsers` (external, read-only).
- Joins `jan_portal_users` (role/location) and `jan_departments` + `hod_master` for the response.
- Returns a JWT carrying `sub` (userId), `role`, `name`, `deptId`.
- `CmplUsers` and `HodMaster` — GET only, no create/edit exposed.

---

### `Application/Services/IAuthService.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IAuthService
{
    Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto dto);
}
```

---

### `Application/Services/AuthService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;
using Web.Infrastructure.Utilities;

namespace Web.Application.Services;

public sealed class AuthService(
    CmplDbContext cmplDb,
    HodDbContext hodDb,
    AppDbContext db,
    JwtTokenGenerator jwtGenerator) : IAuthService
{
    public async Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto dto)
    {
        // Resolve user from CMPL (external read-only source)
        // Identifier can be employee ID or email
        var cmplUser = await cmplDb.CmplUsers
            .FirstOrDefaultAsync(u =>
                u.EmployeeId == dto.Identifier || u.Email == dto.Identifier);

        if (cmplUser is null)
            return Result.Failure<LoginResponseDto>(
                Error.NotFound("AUTH_001", "User not found."));

        // Password check: compare against portal users table
        // Assumes passwords are stored hashed in jan_portal_users
        var portalUser = await db.Users.FirstOrDefaultAsync(u => u.Id == cmplUser.Id);

        if (portalUser is null || !portalUser.IsActive)
            return Result.Failure<LoginResponseDto>(
                Error.Validation("AUTH_002", "Account is inactive or not registered in the portal."));

        // Basic password verification placeholder — replace with BCrypt / PBKDF2 as needed
        // if (!BCrypt.Net.BCrypt.Verify(dto.Password, portalUser.PasswordHash))
        //     return Result.Failure<LoginResponseDto>(Error.Validation("AUTH_003", "Invalid credentials."));

        // Resolve department
        Department? department = null;
        HodMaster? hod = null;

        if (cmplUser.DepartmentId.HasValue)
        {
            department = await db.Departments
                .FirstOrDefaultAsync(d => d.Id == cmplUser.DepartmentId.Value && d.IsActive);

            if (department?.HodId is not null
                && int.TryParse(department.HodId, out var hodId))
            {
                hod = await hodDb.HodMasters
                    .FirstOrDefaultAsync(h => h.UserId == hodId && h.Deleted == 0);
            }
        }

        var userProfile = new UserProfile(
            Id:           cmplUser.Id,
            Name:         cmplUser.Name,
            Role:         portalUser.Role,
            Location:     portalUser.Location,
            EmployeeId:   cmplUser.EmployeeId,
            Email:        cmplUser.Email,
            MobileNumber: cmplUser.MobileNumber,
            DepartmentId: cmplUser.DepartmentId
        );

        var token = jwtGenerator.Generate(
            userId:   cmplUser.Id,
            name:     cmplUser.Name,
            role:     portalUser.Role,
            deptId:   cmplUser.DepartmentId);

        return Result.Success(new LoginResponseDto
        {
            User = userProfile,
            Department = department is null ? null : new DepartmentDto(
                department.Id,
                department.Name,
                department.HodId),
            HeadOfDepartment = hod is null ? null : new HodDto(
                hod.UserId,
                hod.Name,
                hod.EmployeeId,
                hod.Email,
                hod.MobileNumber),
            Token = token
        });
    }
}
```

---

### `API/Controllers/AuthController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Entities;

namespace Web.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Identifier) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Identifier and password are required." });

        var result = await authService.LoginAsync(dto);

        if (result.IsFailure)
            return result.Error!.Type == ErrorType.NotFound
                ? Unauthorized(new { message = result.Error.Message })
                : BadRequest(new { message = result.Error.Message });

        return Ok(result.Value);
    }

    // POST api/auth/logout  (stateless JWT — client discards token)
    [HttpPost("logout")]
    public IActionResult Logout() => Ok(new { message = "Logged out." });
}
```

---

## 3. User Service & Controller

### Rules

- `CmplUsers` is **read-only** (external DB, no migrations).
- `jan_portal_users` supports **CRUD** (role, location, active flag).
- HOD lookup is **read-only** via `HodDbContext`.
- Listing users returns the merged view: CMPL profile + portal role + dept info.

---

### `Application/Services/IUserService.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IUserService
{
    // CmplUsers — GET only
    Task<PagedResult<CmplUserDto>> GetCmplUsersAsync(int page, int pageSize, string? search);
    Task<Result<CmplUserDto>> GetCmplUserByIdAsync(int id);

    // HodMaster — GET only
    Task<PagedResult<HodDto>> GetHodsAsync(int page, int pageSize, string? search);
    Task<Result<HodDto>> GetHodByIdAsync(int id);

    // Portal Users — full CRUD
    Task<PagedResult<PortalUserDto>> GetPortalUsersAsync(int page, int pageSize, string? search);
    Task<Result<PortalUserDto>> GetPortalUserByIdAsync(int id);
    Task<Result<int>> CreatePortalUserAsync(UpsertPortalUserDto dto, int createdBy);
    Task<Result> UpdatePortalUserAsync(int id, UpsertPortalUserDto dto, int updatedBy);
    Task<Result> DeletePortalUserAsync(int id, int deletedBy);
}
```

---

### `Application/Services/UserService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class UserService(
    AppDbContext db,
    CmplDbContext cmplDb,
    HodDbContext hodDb) : IUserService
{
    // ─── CmplUsers (read-only) ───────────────────────────────────────────────────

    public async Task<PagedResult<CmplUserDto>> GetCmplUsersAsync(
        int page, int pageSize, string? search)
    {
        var query = cmplDb.CmplUsers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u =>
                u.Name.Contains(search) ||
                (u.EmployeeId != null && u.EmployeeId.Contains(search)) ||
                (u.Email != null && u.Email.Contains(search)));

        var total = await query.CountAsync();
        var data  = await query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new CmplUserDto(u.Id, u.Name, u.EmployeeId, u.Email,
                u.MobileNumber, u.DepartmentId))
            .ToListAsync();

        return new PagedResult<CmplUserDto>(data, total, page, pageSize);
    }

    public async Task<Result<CmplUserDto>> GetCmplUserByIdAsync(int id)
    {
        var user = await cmplDb.CmplUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            return Result.Failure<CmplUserDto>(
                Error.NotFound("USR_001", "CMPL user not found."));

        return Result.Success(new CmplUserDto(
            user.Id, user.Name, user.EmployeeId,
            user.Email, user.MobileNumber, user.DepartmentId));
    }

    // ─── HodMaster (read-only) ───────────────────────────────────────────────────

    public async Task<PagedResult<HodDto>> GetHodsAsync(
        int page, int pageSize, string? search)
    {
        var query = hodDb.HodMasters
            .Where(h => h.Deleted == 0)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(h =>
                h.Name.Contains(search) ||
                (h.EmployeeId != null && h.EmployeeId.Contains(search)) ||
                (h.Email != null && h.Email.Contains(search)));

        var total = await query.CountAsync();
        var data  = await query
            .OrderBy(h => h.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new HodDto(h.UserId, h.Name, h.EmployeeId, h.Email, h.MobileNumber))
            .ToListAsync();

        return new PagedResult<HodDto>(data, total, page, pageSize);
    }

    public async Task<Result<HodDto>> GetHodByIdAsync(int id)
    {
        var hod = await hodDb.HodMasters
            .FirstOrDefaultAsync(h => h.UserId == id && h.Deleted == 0);

        if (hod is null)
            return Result.Failure<HodDto>(
                Error.NotFound("HOD_001", "HOD not found."));

        return Result.Success(new HodDto(
            hod.UserId, hod.Name, hod.EmployeeId, hod.Email, hod.MobileNumber));
    }

    // ─── Portal Users (CRUD) ─────────────────────────────────────────────────────

    public async Task<PagedResult<PortalUserDto>> GetPortalUsersAsync(
        int page, int pageSize, string? search)
    {
        // Join portal users with CMPL users for the merged view
        var portalUsers = await db.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var total = await db.Users.CountAsync(u => u.IsActive);

        var ids = portalUsers.Select(u => u.Id).ToList();

        var cmplUsers = await cmplDb.CmplUsers
            .Where(c => ids.Contains(c.Id))
            .ToListAsync();

        var result = portalUsers.Select(pu =>
        {
            var cmpl = cmplUsers.FirstOrDefault(c => c.Id == pu.Id);
            return new PortalUserDto(
                pu.Id,
                cmpl?.Name ?? string.Empty,
                cmpl?.EmployeeId,
                cmpl?.Email,
                cmpl?.MobileNumber,
                cmpl?.DepartmentId,
                pu.Role,
                pu.Location,
                pu.IsActive,
                pu.CreatedOn);
        }).ToList();

        return new PagedResult<PortalUserDto>(result, total, page, pageSize);
    }

    public async Task<Result<PortalUserDto>> GetPortalUserByIdAsync(int id)
    {
        var pu = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (pu is null)
            return Result.Failure<PortalUserDto>(
                Error.NotFound("USR_002", "Portal user not found."));

        var cmpl = await cmplDb.CmplUsers.FirstOrDefaultAsync(c => c.Id == id);

        return Result.Success(new PortalUserDto(
            pu.Id,
            cmpl?.Name ?? string.Empty,
            cmpl?.EmployeeId,
            cmpl?.Email,
            cmpl?.MobileNumber,
            cmpl?.DepartmentId,
            pu.Role,
            pu.Location,
            pu.IsActive,
            pu.CreatedOn));
    }

    public async Task<Result<int>> CreatePortalUserAsync(
        UpsertPortalUserDto dto, int createdBy)
    {
        // Validate the CMPL user exists first
        var cmplExists = await cmplDb.CmplUsers.AnyAsync(c => c.Id == dto.CmplUserId);
        if (!cmplExists)
            return Result.Failure<int>(
                Error.NotFound("USR_003", "No CMPL user found with this ID."));

        var alreadyRegistered = await db.Users.AnyAsync(u => u.Id == dto.CmplUserId);
        if (alreadyRegistered)
            return Result.Failure<int>(
                Error.Conflict("USR_004", "This user is already registered in the portal."));

        var user = new User
        {
            Id        = dto.CmplUserId,
            Role      = dto.Role,
            Location  = dto.Location,
            IsActive  = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Result.Success(user.Id);
    }

    public async Task<Result> UpdatePortalUserAsync(
        int id, UpsertPortalUserDto dto, int updatedBy)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            return Result.Failure(Error.NotFound("USR_002", "Portal user not found."));

        user.Role       = dto.Role;
        user.Location   = dto.Location;
        user.ModifiedOn = DateTime.UtcNow;
        user.ModifiedBy = updatedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> DeletePortalUserAsync(int id, int deletedBy)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            return Result.Failure(Error.NotFound("USR_002", "Portal user not found."));

        // Soft delete
        user.IsActive   = false;
        user.ModifiedOn = DateTime.UtcNow;
        user.ModifiedBy = deletedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }
}
```

---

### `API/Controllers/UsersController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Dto;

namespace Web.API.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController(IUserService userService) : ControllerBase
{
    // ─── CMPL Users (GET only) ───────────────────────────────────────────────────

    // GET api/users/cmpl?page=1&pageSize=20&search=
    [HttpGet("cmpl")]
    public async Task<IActionResult> GetCmplUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await userService.GetCmplUsersAsync(page, pageSize, search));

    // GET api/users/cmpl/{id}
    [HttpGet("cmpl/{id:int}")]
    public async Task<IActionResult> GetCmplUser(int id)
    {
        var result = await userService.GetCmplUserByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // ─── HOD Master (GET only) ───────────────────────────────────────────────────

    // GET api/users/hods?page=1&pageSize=20&search=
    [HttpGet("hods")]
    public async Task<IActionResult> GetHods(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await userService.GetHodsAsync(page, pageSize, search));

    // GET api/users/hods/{id}
    [HttpGet("hods/{id:int}")]
    public async Task<IActionResult> GetHod(int id)
    {
        var result = await userService.GetHodByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // ─── Portal Users (full CRUD) ─────────────────────────────────────────────────

    // GET api/users?page=1&pageSize=20&search=
    [HttpGet]
    public async Task<IActionResult> GetPortalUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await userService.GetPortalUsersAsync(page, pageSize, search));

    // GET api/users/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPortalUser(int id)
    {
        var result = await userService.GetPortalUserByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // POST api/users
    [HttpPost]
    public async Task<IActionResult> CreatePortalUser([FromBody] UpsertPortalUserDto dto)
    {
        var result = await userService.CreatePortalUserAsync(dto, GetCallerId());
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetPortalUser), new { id = result.Value }, result.Value)
            : HandleFailure(result);
    }

    // PUT api/users/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdatePortalUser(int id, [FromBody] UpsertPortalUserDto dto)
    {
        var result = await userService.UpdatePortalUserAsync(id, dto, GetCallerId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // DELETE api/users/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePortalUser(int id)
    {
        var result = await userService.DeletePortalUserAsync(id, GetCallerId());
        return result.IsSuccess ? NoContent() : HandleFailure(result);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private int GetCallerId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound   => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            ErrorType.Conflict   => Conflict(result.Error),
            _                    => StatusCode(500, result.Error)
        };
}
```

---

## 4. Department Service & Controller

### Rules

- `jan_departments` supports **full CRUD**.
- `HodId` column references `hod_master.id_row` — validate against `HodDbContext` on create/update.
- Soft-delete via `IsActive`.

---

### `Application/Services/IDepartmentService.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IDepartmentService
{
    Task<PagedResult<DepartmentDetailDto>> GetAllAsync(int page, int pageSize, string? search);
    Task<Result<DepartmentDetailDto>> GetByIdAsync(int id);
    Task<Result<int>> CreateAsync(UpsertDepartmentDto dto, int createdBy);
    Task<Result> UpdateAsync(int id, UpsertDepartmentDto dto, int updatedBy);
    Task<Result> DeleteAsync(int id, int deletedBy);
}
```

---

### `Application/Services/DepartmentService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class DepartmentService(
    AppDbContext db,
    HodDbContext hodDb) : IDepartmentService
{
    public async Task<PagedResult<DepartmentDetailDto>> GetAllAsync(
        int page, int pageSize, string? search)
    {
        var query = db.Departments.Where(d => d.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(d => d.Name != null && d.Name.Contains(search));

        var total = await query.CountAsync();
        var depts = await query
            .OrderBy(d => d.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Enrich with HOD names in bulk
        var hodIds = depts
            .Where(d => d.HodId != null && int.TryParse(d.HodId, out _))
            .Select(d => int.Parse(d.HodId!))
            .Distinct()
            .ToList();

        var hods = await hodDb.HodMasters
            .Where(h => hodIds.Contains(h.UserId) && h.Deleted == 0)
            .ToDictionaryAsync(h => h.UserId);

        var data = depts.Select(d =>
        {
            HodMaster? hod = null;
            if (d.HodId is not null && int.TryParse(d.HodId, out var hodId))
                hods.TryGetValue(hodId, out hod);

            return new DepartmentDetailDto(
                d.Id,
                d.Name,
                d.HodId,
                hod?.Name,
                hod?.Email,
                d.IsActive,
                d.CreatedOn);
        }).ToList();

        return new PagedResult<DepartmentDetailDto>(data, total, page, pageSize);
    }

    public async Task<Result<DepartmentDetailDto>> GetByIdAsync(int id)
    {
        var dept = await db.Departments
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive);

        if (dept is null)
            return Result.Failure<DepartmentDetailDto>(
                Error.NotFound("DEPT_001", "Department not found."));

        HodMaster? hod = null;
        if (dept.HodId is not null && int.TryParse(dept.HodId, out var hodId))
            hod = await hodDb.HodMasters
                .FirstOrDefaultAsync(h => h.UserId == hodId && h.Deleted == 0);

        return Result.Success(new DepartmentDetailDto(
            dept.Id,
            dept.Name,
            dept.HodId,
            hod?.Name,
            hod?.Email,
            dept.IsActive,
            dept.CreatedOn));
    }

    public async Task<Result<int>> CreateAsync(UpsertDepartmentDto dto, int createdBy)
    {
        if (!string.IsNullOrWhiteSpace(dto.HodId))
        {
            if (!int.TryParse(dto.HodId, out var hodId))
                return Result.Failure<int>(
                    Error.Validation("DEPT_002", "HodId must be a valid integer."));

            var hodExists = await hodDb.HodMasters
                .AnyAsync(h => h.UserId == hodId && h.Deleted == 0);

            if (!hodExists)
                return Result.Failure<int>(
                    Error.NotFound("DEPT_003", "The specified HOD does not exist."));
        }

        var dept = new Department
        {
            Name      = dto.Name,
            HodId     = dto.HodId,
            IsActive  = true,
            CreatedOn = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        return Result.Success(dept.Id);
    }

    public async Task<Result> UpdateAsync(int id, UpsertDepartmentDto dto, int updatedBy)
    {
        var dept = await db.Departments
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive);

        if (dept is null)
            return Result.Failure(Error.NotFound("DEPT_001", "Department not found."));

        if (!string.IsNullOrWhiteSpace(dto.HodId))
        {
            if (!int.TryParse(dto.HodId, out var hodId))
                return Result.Failure(
                    Error.Validation("DEPT_002", "HodId must be a valid integer."));

            var hodExists = await hodDb.HodMasters
                .AnyAsync(h => h.UserId == hodId && h.Deleted == 0);

            if (!hodExists)
                return Result.Failure(
                    Error.NotFound("DEPT_003", "The specified HOD does not exist."));
        }

        dept.Name       = dto.Name;
        dept.HodId      = dto.HodId;
        dept.ModifiedOn = DateTime.UtcNow;
        dept.ModifiedBy = updatedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> DeleteAsync(int id, int deletedBy)
    {
        var dept = await db.Departments
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive);

        if (dept is null)
            return Result.Failure(Error.NotFound("DEPT_001", "Department not found."));

        dept.IsActive   = false;
        dept.ModifiedOn = DateTime.UtcNow;
        dept.ModifiedBy = deletedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }
}
```

---

### `API/Controllers/DepartmentsController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Dto;

namespace Web.API.Controllers;

[ApiController]
[Route("api/departments")]
public sealed class DepartmentsController(IDepartmentService service) : ControllerBase
{
    // GET api/departments?page=1&pageSize=20&search=
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await service.GetAllAsync(page, pageSize, search));

    // GET api/departments/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await service.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // POST api/departments
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertDepartmentDto dto)
    {
        var result = await service.CreateAsync(dto, GetCallerId());
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value }, result.Value)
            : HandleFailure(result);
    }

    // PUT api/departments/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertDepartmentDto dto)
    {
        var result = await service.UpdateAsync(id, dto, GetCallerId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // DELETE api/departments/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await service.DeleteAsync(id, GetCallerId());
        return result.IsSuccess ? NoContent() : HandleFailure(result);
    }

    private int GetCallerId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound   => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            ErrorType.Conflict   => Conflict(result.Error),
            _                    => StatusCode(500, result.Error)
        };
}
```

---

## 5. FolderMapping Service & Controller

### Rules

- `jan_folder_mappings` supports **full CRUD**.
- `PrimaryHodId` / `SecondaryHodId` are validated against `hod_master` on create/update.
- On update, if HOD changes the service does **not** cascade access re-validation — that is a separate admin concern.

---

### `Application/Services/IFolderMappingService.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.Application.Services;

public interface IFolderMappingService
{
    Task<PagedResult<FolderMappingDto>> GetAllAsync(int page, int pageSize, string? search);
    Task<Result<FolderMappingDto>> GetByIdAsync(int id);
    Task<Result<int>> CreateAsync(UpsertFolderMappingRequest dto, int createdBy);
    Task<Result> UpdateAsync(int id, UpsertFolderMappingRequest dto, int updatedBy);
    Task<Result> DeleteAsync(int id, int deletedBy);
}
```

---

### `Application/Services/FolderMappingService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public sealed class FolderMappingService(
    AppDbContext db,
    HodDbContext hodDb) : IFolderMappingService
{
    public async Task<PagedResult<FolderMappingDto>> GetAllAsync(
        int page, int pageSize, string? search)
    {
        var query = db.FolderMappings.Where(f => f.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(f => f.FolderName.Contains(search));

        var total = await query.CountAsync();
        var data  = await query
            .OrderBy(f => f.FolderName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => MapToDto(f))
            .ToListAsync();

        return new PagedResult<FolderMappingDto>(data, total, page, pageSize);
    }

    public async Task<Result<FolderMappingDto>> GetByIdAsync(int id)
    {
        var entity = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        if (entity is null)
            return Result.Failure<FolderMappingDto>(
                Error.NotFound("FOLDER_001", "Folder mapping not found."));

        return Result.Success(MapToDto(entity));
    }

    public async Task<Result<int>> CreateAsync(
        UpsertFolderMappingRequest dto, int createdBy)
    {
        // Validate duplicate folder path
        var exists = await db.FolderMappings
            .AnyAsync(f => f.FolderName == dto.FolderPath && f.IsActive);

        if (exists)
            return Result.Failure<int>(
                Error.Conflict("FOLDER_002", "A mapping for this folder path already exists."));

        var validationError = await ValidateHodIdsAsync(dto.PrimaryHodId, dto.SecondaryHodId);
        if (validationError is not null)
            return Result.Failure<int>(validationError);

        var entity = new FolderMappingEntity
        {
            FolderName         = dto.FolderPath,
            PrimaryHodId       = dto.PrimaryHodId,
            PrimaryHodName     = dto.PrimaryHodName,
            PrimaryHodEmail    = dto.PrimaryHodEmail,
            SecondaryHodId     = dto.SecondaryHodId,
            SecondaryHodName   = dto.SecondaryHodName,
            SecondaryHodEmail  = dto.SecondaryHodEmail,
            IsActive           = true,
            CreatedOn          = DateTime.UtcNow,
            CreatedBy          = createdBy
        };

        db.FolderMappings.Add(entity);
        await db.SaveChangesAsync();
        return Result.Success(entity.Id);
    }

    public async Task<Result> UpdateAsync(
        int id, UpsertFolderMappingRequest dto, int updatedBy)
    {
        var entity = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        if (entity is null)
            return Result.Failure(Error.NotFound("FOLDER_001", "Folder mapping not found."));

        // Check path conflict (excluding self)
        var pathConflict = await db.FolderMappings
            .AnyAsync(f => f.FolderName == dto.FolderPath && f.Id != id && f.IsActive);

        if (pathConflict)
            return Result.Failure(
                Error.Conflict("FOLDER_002", "Another mapping already uses this folder path."));

        var validationError = await ValidateHodIdsAsync(dto.PrimaryHodId, dto.SecondaryHodId);
        if (validationError is not null)
            return Result.Failure(validationError);

        entity.FolderName        = dto.FolderPath;
        entity.PrimaryHodId      = dto.PrimaryHodId;
        entity.PrimaryHodName    = dto.PrimaryHodName;
        entity.PrimaryHodEmail   = dto.PrimaryHodEmail;
        entity.SecondaryHodId    = dto.SecondaryHodId;
        entity.SecondaryHodName  = dto.SecondaryHodName;
        entity.SecondaryHodEmail = dto.SecondaryHodEmail;
        entity.ModifiedOn        = DateTime.UtcNow;
        entity.ModifiedBy        = updatedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> DeleteAsync(int id, int deletedBy)
    {
        var entity = await db.FolderMappings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        if (entity is null)
            return Result.Failure(Error.NotFound("FOLDER_001", "Folder mapping not found."));

        entity.IsActive   = false;
        entity.ModifiedOn = DateTime.UtcNow;
        entity.ModifiedBy = deletedBy;

        await db.SaveChangesAsync();
        return Result.Success();
    }

    // ─── Private ─────────────────────────────────────────────────────────────────

    private async Task<Error?> ValidateHodIdsAsync(string? primaryHodId, string? secondaryHodId)
    {
        if (!string.IsNullOrWhiteSpace(primaryHodId))
        {
            if (!int.TryParse(primaryHodId, out var pid))
                return Error.Validation("FOLDER_003", "PrimaryHodId must be a valid integer.");

            var exists = await hodDb.HodMasters.AnyAsync(h => h.UserId == pid && h.Deleted == 0);
            if (!exists)
                return Error.NotFound("FOLDER_004", "Primary HOD not found in HOD master.");
        }

        if (!string.IsNullOrWhiteSpace(secondaryHodId))
        {
            if (!int.TryParse(secondaryHodId, out var sid))
                return Error.Validation("FOLDER_005", "SecondaryHodId must be a valid integer.");

            var exists = await hodDb.HodMasters.AnyAsync(h => h.UserId == sid && h.Deleted == 0);
            if (!exists)
                return Error.NotFound("FOLDER_006", "Secondary HOD not found in HOD master.");
        }

        return null;
    }

    private static FolderMappingDto MapToDto(FolderMappingEntity f) => new(
        f.Id,
        f.FolderName,
        f.PrimaryHodId,
        f.PrimaryHodName,
        f.PrimaryHodEmail,
        f.SecondaryHodId,
        f.SecondaryHodName,
        f.SecondaryHodEmail
    );
}
```

---

### `API/Controllers/FolderMappingsController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Dto;

namespace Web.API.Controllers;

[ApiController]
[Route("api/folder-mappings")]
public sealed class FolderMappingsController(IFolderMappingService service) : ControllerBase
{
    // GET api/folder-mappings?page=1&pageSize=20&search=
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await service.GetAllAsync(page, pageSize, search));

    // GET api/folder-mappings/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await service.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // POST api/folder-mappings
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertFolderMappingRequest dto)
    {
        var result = await service.CreateAsync(dto, GetCallerId());
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value }, result.Value)
            : HandleFailure(result);
    }

    // PUT api/folder-mappings/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertFolderMappingRequest dto)
    {
        var result = await service.UpdateAsync(id, dto, GetCallerId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // DELETE api/folder-mappings/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await service.DeleteAsync(id, GetCallerId());
        return result.IsSuccess ? NoContent() : HandleFailure(result);
    }

    private int GetCallerId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound   => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            ErrorType.Conflict   => Conflict(result.Error),
            _                    => StatusCode(500, result.Error)
        };
}
```

---

## 6. New DTOs

Add these alongside your existing DTOs:

```csharp
// Domain/Dto/Auth/LoginResponseDto.cs  — extend your existing record to add Token
// Replace your current LoginResponseDto sealed class body with:

public sealed class LoginResponseDto
{
    public UserProfile? User { get; init; }
    public DepartmentDto? Department { get; init; }
    public HodDto? HeadOfDepartment { get; init; }
    public string Token { get; init; } = string.Empty;  // ← ADD THIS
}

// ─────────────────────────────────────────────────────────────────────────────

// Domain/Dto/Users/UserDtos.cs
namespace Web.Domain.Dto;

public sealed record CmplUserDto(
    int Id,
    string Name,
    string? EmployeeId,
    string? Email,
    string? MobileNumber,
    int? DepartmentId
);

public sealed record PortalUserDto(
    int Id,
    string Name,
    string? EmployeeId,
    string? Email,
    string? MobileNumber,
    int? DepartmentId,
    string Role,
    string Location,
    bool IsActive,
    DateTime CreatedOn
);

public sealed record UpsertPortalUserDto(
    int CmplUserId,
    string Role,      // "Admin" | "It" | "Hod" | "User"
    string Location
);

// ─────────────────────────────────────────────────────────────────────────────

// Domain/Dto/Departments/DepartmentDtos.cs
namespace Web.Domain.Dto;

public sealed record DepartmentDetailDto(
    int Id,
    string? Name,
    string? HodId,
    string? HodName,
    string? HodEmail,
    bool IsActive,
    DateTime CreatedOn
);

public sealed record UpsertDepartmentDto(
    string Name,
    string? HodId   // nullable — a dept may not have a HOD assigned yet
);
```

> **Note:** `FolderMappingDto` and `UpsertFolderMappingRequest` already exist in your uploaded `FolderMappingDto.cs` — no changes needed there.

---

## 7. JWT Helper

### `Infrastructure/Utilities/JwtTokenGenerator.cs`

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Web.Infrastructure.Utilities;

public sealed class JwtTokenGenerator(IConfiguration config)
{
    public string Generate(int userId, string name, string role, int? deptId)
    {
        var key     = new SymmetricSecurityKey(
                          Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(
                          int.Parse(config["Jwt:ExpiryHours"] ?? "8"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,  userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, name),
            new Claim(ClaimTypes.Role,              role),
            new Claim("deptId",                     deptId?.ToString() ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti,  Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer:             config["Jwt:Issuer"],
            audience:           config["Jwt:Audience"],
            claims:             claims,
            expires:            expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### `appsettings.json` — add JWT section

```json
"Jwt": {
  "Secret":      "YOUR_MINIMUM_32_CHARACTER_SECRET_KEY_HERE",
  "Issuer":      "JanaticsPortal",
  "Audience":    "JanaticsPortalClient",
  "ExpiryHours": "8"
}
```

---

## 8. Program.cs Additions

Add these blocks to what was already specified in the first guide:

```csharp
// ─── JWT Authentication ────────────────────────────────────────────────────
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        var jwtConfig = builder.Configuration.GetSection("Jwt");
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtConfig["Issuer"],
            ValidAudience            = jwtConfig["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                                           Encoding.UTF8.GetBytes(jwtConfig["Secret"]!))
        };

        // Allow SignalR to use JWT from query string (required for WebSocket upgrade)
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken)
                    && path.StartsWithSegments("/hubs"))
                {
                    ctx.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ─── New Service Registrations ─────────────────────────────────────────────
builder.Services.AddScoped<IAuthService,          AuthService>();
builder.Services.AddScoped<IUserService,          UserService>();
builder.Services.AddScoped<IDepartmentService,    DepartmentService>();
builder.Services.AddScoped<IFolderMappingService, FolderMappingService>();
builder.Services.AddSingleton<JwtTokenGenerator>();

// ─── In the pipeline (after app.UseCors()) ─────────────────────────────────
app.UseAuthentication();
app.UseAuthorization();
```

---

## 9. Role-based Endpoint Access Summary

| Controller | Endpoint | Allowed Roles |
|---|---|---|
| **Auth** | `POST /login` | Anonymous |
| **Auth** | `POST /logout` | Any authenticated |
| **Users** | `GET /cmpl` | Admin, It |
| **Users** | `GET /cmpl/{id}` | Admin, It, Hod |
| **Users** | `GET /hods` | Admin, It, Hod |
| **Users** | `GET /hods/{id}` | Admin, It, Hod |
| **Users** | `GET /` | Admin |
| **Users** | `POST, PUT, DELETE /` | Admin |
| **Departments** | `GET /` | Admin, It, Hod |
| **Departments** | `POST, PUT, DELETE /` | Admin |
| **FolderMappings** | `GET /` | Admin, It, Hod, User |
| **FolderMappings** | `POST, PUT, DELETE /` | Admin, It |
| **AccessRequests** | `POST /` | User, Hod |
| **AccessRequests** | `POST /hod` | Hod |
| **HodCart** | All | Hod |
| **OperatorCart** | All | It |
| **Dashboard** | `GET /` | All authenticated |
| **Notifications** | All | All authenticated |

To enforce this, add `[Authorize(Roles = "Admin")]` (or comma-separated) above each action or controller class. Example:

```csharp
// On the controller class — applies to all actions
[Authorize(Roles = "Admin,It")]

// Or per-action override
[Authorize(Roles = "Admin")]
[HttpDelete("{id:int}")]
public async Task<IActionResult> Delete(int id) { ... }
```

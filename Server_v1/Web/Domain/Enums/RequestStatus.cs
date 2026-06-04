namespace Web.Domain.Enums;

public enum RequestStatus
{
    Submitted = 1,
    PendingWithHod = 2,
    PendingWithIt = 3,
    HodApproved = 4,
    ItApproved = 5,
    HodRejected = 6,
    ItRejected = 7,
    Revoked = 8,
    Expired = 9 //Approved date from 90 calender days
}

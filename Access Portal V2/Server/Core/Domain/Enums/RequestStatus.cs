namespace Server.Core.Domain.Enums;

/// <summary>
/// Defines the explicit lifecycle states for access requests and line items 
/// through organizational validation gates.
/// </summary>
public enum RequestStatus
{
    /// <summary>
    /// Request has been raised and is waiting for HOD or Data Owner validation.
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Action has been explicitly approved by a Head of Department or Data Owner.
    /// </summary>
    Approved = 1,

    /// <summary>
    /// Action has been explicitly rejected or vetoed at any validation stage.
    /// </summary>
    Rejected = 2,

    /// <summary>
    /// Workflow short-circuit flag signaling that HOD clearstamps are verified, 
    /// and the ticket is now in the IT Provisioning queue.
    /// </summary>
    ApprovedByHod = 3,

    /// <summary>
    /// Final state signaling that the IT desk has successfully provisioned 
    /// folder rights and access is officially granted.
    /// </summary>
    Completed = 4,

    Revoked = 5,

    Expired = 6,

    ItemRejectedByIt = 7
}

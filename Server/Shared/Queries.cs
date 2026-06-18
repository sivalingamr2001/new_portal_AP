namespace Backend.Shared;

/// <summary>
/// Provides centralized SQL query constants used throughout the application.
/// </summary>
public static class Queries
{
    /// <summary>
    /// Retrieves the assigned Region and SubRegion for a specific user after successful authentication.
    /// </summary>
    public const string GetRegionDetailsAfterLogin = @"
            SELECT 
                TER_NAME AS Region, 
                DR_REGION AS SubRegion 
            FROM jan_bms_login_v 
            WHERE UNAME = :Uname AND PWD = :Password";

    /// <summary>
    /// Retrieves a unique list of all available Regions and SubRegions within the system.
    /// </summary>
    public const string GetAllRegionDetails = @"
            SELECT DISTINCT
                TER_NAME AS Region, 
                DR_REGION AS SubRegion 
            FROM jan_bms_login_v";

    /// <summary>
    /// Fetches unique customer IDs, names, and regions configured with a 'BILL_TO' site use code filtered by UI parameters.
    /// </summary>
    public const string GetBillToCustomersByRegion = @"
            SELECT DISTINCT customer_id AS CustomerId, customer_name AS CustomerName, REGION AS Region 
            FROM (
                SELECT ra.customer_id, ra.customer_name,
                       (SELECT segment14 FROM ra_territories WHERE territory_id = ras.territory_id) AS REGION 
                FROM ra_customers ra
                JOIN ra_addresses_all ad ON ra.customer_id = ad.customer_id
                JOIN ra_site_uses_all ras ON ad.address_id = ras.address_id
                WHERE ras.site_use_code = 'BILL_TO'
            ) 
            WHERE REGION = :Region OR REGION = :SubRegion
            ORDER BY customer_name ASC";

    /// <summary>
    /// Fetches unique customer IDs, names, and regions configured with a 'SHIP_TO' site use code filtered by UI parameters.
    /// </summary>
    public const string GetShipToCustomersByRegion = @"
            SELECT DISTINCT customer_id AS CustomerId, customer_name AS CustomerName, REGION AS Region 
            FROM (
                SELECT ra.customer_id, ra.customer_name,
                       (SELECT segment14 FROM ra_territories WHERE territory_id = ras.territory_id) AS REGION 
                FROM ra_customers ra
                JOIN ra_addresses_all ad ON ra.customer_id = ad.customer_id
                JOIN ra_site_uses_all ras ON ad.address_id = ras.address_id
                WHERE ras.site_use_code = 'SHIP_TO'
            ) 
            WHERE REGION = :Region OR REGION = :SubRegion
            ORDER BY customer_name ASC";

    /// <summary>
    /// Retrieves a list of prepared employee names and numbers based on specific management levels within a dynamic region.
    /// </summary>
    public const string GetPreparedByEmployees = @"
            SELECT last_name AS LastName, employee_number AS EmployeeNumber 
            FROM jan_emp_mast_v 
            WHERE LOCATION = :Region 
              AND level1 IN ('AML1', 'OML1', 'OML2', 'OML3', 'AML3', 'AML2') 
            ORDER BY last_name ASC";

    /// <summary>
    /// Retrieves multi-location address details (Bill-To or Ship-To) for a specific customer ID and Organization ID.
    /// Expects parameters: :SiteUseCode, :OrgId, and :CustomerId.
    /// </summary>
    public const string GetCustomerMultipleLocations = @"
        SELECT ads.address1 AS ""Address1"", 
               ads.address2 AS ""Address2"", 
               ads.address3 AS ""Address3"", 
               ads.city AS ""City"", 
               ads.postal_code AS ""PostalCode"", 
               ads.org_id AS ""OrgId"",
               ras.location AS ""Location""
        FROM ra_customers ra
        JOIN ra_addresses_all ads ON ra.customer_id = ads.customer_id 
        JOIN ra_site_uses_all ras ON ads.address_id = ras.address_id
        WHERE ras.site_use_code = :SiteUseCode 
          AND ads.org_id = :OrgId 
          AND ra.customer_id = :CustomerId";

    /// <summary>
    /// Generates a dropdown list containing the next two chronological weeks formatted as 'YYYYIW', safely tracking Org and Customer contexts.
    /// </summary>
    public const string GetWeekDropdownList = @"
            SELECT TO_CHAR(SYSDATE + (LEVEL * 7), 'YYYYIW') AS future_weeks
            FROM DUAL
            CONNECT BY LEVEL <= 2";

    /// <summary>
    /// Retrieves targeted corporate operational unit profiles filtered by core organization identifiers.
    /// Maps to: /api/Allocation/operating-units
    /// </summary>
    public const string GetOperatingUnitDetails = @"
            SELECT ORGANIZATION_ID AS ""OrganizationId"", NAME AS ""Name"" 
            FROM hr_operating_units 
            WHERE ORGANIZATION_ID IN (103, 704, 844)
            ORDER BY ""Name"" ASC";

    /// <summary>
    /// Retrieves specific inventory organization definitions.
    /// </summary>
    public const string GetInventoryOrganizations = @"
            SELECT ORGANIZATION_ID AS ""OrganizationId"", ORGANIZATION_CODE AS ""OrganizationCode"" 
            FROM ORG_ORGANIZATION_DEFINITIONS 
            WHERE OPERATING_UNIT IN (103,704,844)
              AND ORGANIZATION_ID IN (904,924,110,111,304,384,524,464,444,504,484,505,644,804,1025,724)";

    /// <summary>
    /// Retrieves inventory item ID based on the Segment1 item code.
    /// </summary>
    public const string GetInventoryItemDetails = @"
        SELECT ""InventoryItemId"", ""ItemCode"", ""Description"" FROM (
            SELECT INVENTORY_ITEM_ID AS ""InventoryItemId"", 
                   SEGMENT1 AS ""ItemCode"", 
                   TRIM(REPLACE(DESCRIPTION, '""', '')) AS ""Description"",
                   ROW_NUMBER() OVER (ORDER BY SEGMENT1) AS rn
            FROM MTL_SYSTEM_ITEMS
            WHERE (:Search IS NULL 
                   OR UPPER(SEGMENT1) LIKE UPPER(:Search)
                   OR UPPER(DESCRIPTION) LIKE UPPER(:Search))
        ) WHERE rn > :Offset AND rn <= (:Offset + :PageSize)";

    public const string GetDemandMetrics = @"
        SELECT 
            SUM(PEND_QTY) AS ""OaPendingQuantity"",   
            SUM(RSV_QTY) AS ""OaRsvQty"",
            SUM(PICKED_QTY) AS ""OaPickedQty"",
            nvl((SELECT ROQ FROM JAN_CUSTOMER_REPLENISHMENT_T WHERE END_DATE IS NULL AND CUSTOMER_ID = A.BILL_TO_CUST_ID AND ORGANIZATION_ID = A.SHIP_FROM_ORG_ID AND INVENTORY_ITEM_ID = A.INVENTORY_ITEM_ID), 0) AS ""BinQty"",
            nvl((SELECT SUM(RSV_QTY) FROM JAN_BRSV_TBR_V WHERE CUSTOMER_ID = A.BILL_TO_CUST_ID AND ORGANIZATION_ID = A.SHIP_FROM_ORG_ID AND INVENTORY_ITEM_ID = A.INVENTORY_ITEM_ID), 0) AS ""BinRsvQty""
        FROM JAN_OA_BIN_DEMAND_RSV_N A
        WHERE BILL_TO_CUST_ID = :CustomerId 
          AND SHIP_FROM_ORG_ID = :OrganizationId 
          AND ordered_date >= TO_DATE('01-apr-2021', 'dd-mon-yyyy') 
          AND INVENTORY_ITEM_ID = :InventoryItemId 
        GROUP BY BILL_TO_CUST_ID, INVENTORY_ITEM_ID, SHIP_FROM_ORG_ID";


    /// <summary>
    /// Retrieves the Sales RRS Category for a given Organization and Inventory Item.
    /// </summary>
    public const string GetSalesRrsCategory = @"
            SELECT JAN_SALES_RRS_CATEGORY(:OrganizationId, :InventoryItemId) AS ""RrsCategory"" 
            FROM DUAL";

    // --- BIN ALLOCATION DML QUERIES ---

    public const string InsertAllocationHeader = @"
        INSERT INTO JAN_B3_HEADER (
            HEADER_ID,
            TRANSACTION_DATE, 
            CUSTOMER_OR_ITEM_SPECIFIC, 
            CUSTOMER_ID, 
            TERRITORY_ID, 
            BILL_TO_CUSTOMER, 
            SHIP_TO_CUSTOMER, 
            REMARKS, 
            CREATED_BY, 
            CREATED_DATE
        )
        VALUES (
            JAN_B3_HEADERID_SEQ.NEXTVAL,
            SYSDATE, 
            :AllocationBasis, 
            :CustomerId, 
            :TerritoryId, 
            :BillToCustomerId, 
            :ShipToCustomerId, 
            :Remarks, 
            :CreatedBy, 
            SYSDATE
        )
        RETURNING HEADER_ID INTO :HeaderId";

    public const string InsertAllocationLine = @"
        INSERT INTO JAN_B3_LINES (
            HEADER_ID,
            LINE_ID,
            ORGANIZATION_ID,
            INVENTORY_ITEM_ID,
            B3_QUANTITY,
            TARGET_DATE,
            B3_APPROVED_QUANTITY,
            APPROVAL_FLAG
        )
        VALUES (
            :HeaderId,
            JAN_B3_LINESID_SEQ.NEXTVAL,
            :OrganizationId,
            :InventoryItemId,
            :RequestedQty,
            :TargetDate,
            0,
            'N'
        )";

    public const string UpdateAllocationLine = @"
        UPDATE JAN_B3_LINES 
        SET B3_QUANTITY = :RequestedQty, TARGET_DATE = :TargetDate, APPROVED_DATE = SYSDATE 
        WHERE LINE_ID = :LineId AND APPROVAL_FLAG = 'N'";

    public const string InsertApprovalRecord = @"
        INSERT INTO APPROVALS (ApprovalId, LineId, ApproverId, ApprovedQty, Decision, Remarks, ActionDate)
        VALUES (:APPROVAL_ID, :LINE_ID, :APPROVER_ID, :APPROVED_QTY, :DECISION, :REMARKS, SYSDATE)";

    public const string UpdateLineStatus = @"
        UPDATE JAN_B3_LINES 
        SET APPROVAL_FLAG = :STATUS, B3_APPROVED_QUANTITY = :APPROVED_QTY, APPROVED_DATE = SYSDATE 
        WHERE LINE_ID = :LINE_ID";

    public const string InsertCancellationRecord = @"
        INSERT INTO JAN_B3_CANCELLATION (
            CANCEL_ID,
            LINE_ID,
            CANCELLED_QTY,
            CANCEL_REASON,
            CREATED_BY,
            CANCELLED_DATE,
            CREATED_DATE
        )
        VALUES (
            JAN_B3_CANCELLATION_SEQ.NEXTVAL,
            :LineId,
            :CancelledQty,
            :Reason,
            :CancelledBy,
            SYSDATE,
            SYSDATE
        )";

    public const string RejectAllocationLine = @"
        UPDATE JAN_B3_LINES 
        SET APPROVAL_FLAG = 'R', APPROVED_DATE = SYSDATE 
        WHERE LINE_ID = :LINE_ID";

    public const string CountInventoryItems = @"
        SELECT COUNT(*) 
        FROM MTL_SYSTEM_ITEMS 
        WHERE (:SEARCH IS NULL OR UPPER(SEGMENT1) LIKE UPPER(:SEARCH))";

    public const string GetAllAllocationsGrouped = @"
    SELECT 
        h.BILL_TO_CUSTOMER AS BillToCustomer,
        h.CREATED_BY AS CreatedBy,
        TO_CHAR(h.CREATED_DATE, 'YYYY-MM-DD') AS CreatedDate,
        h.CUSTOMER_ID AS CustomerId,
        h.CUSTOMER_OR_ITEM_SPECIFIC AS AllocationBasis,
        h.HEADER_ID AS HeaderId,
        h.REMARKS AS Remarks,
        h.SHIP_TO_CUSTOMER AS ShipToCustomer,
        h.TERRITORY_ID AS TerritoryId,
        TO_CHAR(h.TRANSACTION_DATE, 'YYYY-MM-DD') AS TransactionDate,
        
        l.LINE_ID AS Id,
        l.APPROVAL_FLAG AS IsApproved,
        l.B3_APPROVED_QUANTITY AS ApprovedQty,
        l.B3_QUANTITY AS BinQty,
        l.HEADER_ID AS ParentHeaderId,
        l.INVENTORY_ITEM_ID AS ItemCode,
        l.ORGANIZATION_ID AS OrganizationId,
        TO_CHAR(l.TARGET_DATE, 'YYYY-MM-DD') AS TargetDate
    FROM JAN_B3_HEADER h
    LEFT JOIN JAN_B3_LINES l ON h.HEADER_ID = l.HEADER_ID
    ORDER BY h.HEADER_ID DESC, l.LINE_ID ASC";

    public const string AmendAllocationLine = @"
        UPDATE JAN_B3_LINES 
        SET APPROVAL_FLAG = 'A', B3_QUANTITY = :NEW_QTY, APPROVED_DATE = SYSDATE 
        WHERE LINE_ID = :LINE_ID";

    /// <summary>
    /// Retrieves a specific operating unit profile by its Organization ID.
    /// </summary>
    public const string GetOperatingUnitById = @"
            SELECT ORGANIZATION_ID AS ""OrganizationId"", NAME AS ""Name"" 
            FROM hr_operating_units 
            WHERE ORGANIZATION_ID = :OrganizationId";

    /// <summary>
    /// Retrieves a specific inventory organization definition by its Organization ID.
    /// </summary>
    public const string GetInventoryOrganizationById = @"
            SELECT ORGANIZATION_ID AS ""OrganizationId"", ORGANIZATION_CODE AS ""OrganizationCode"" 
            FROM ORG_ORGANIZATION_DEFINITIONS 
            WHERE ORGANIZATION_ID = :OrganizationId";

    /// <summary>
    /// Retrieves full details for a specific inventory item using its unique Inventory Item ID.
    /// </summary>
    public const string GetInventoryItemById = @"
            SELECT DISTINCT INVENTORY_ITEM_ID AS ""InventoryItemId"", 
                   SEGMENT1 AS ""ItemCode"", 
                   TRIM(REPLACE(DESCRIPTION, '""', '')) AS ""Description""
            FROM MTL_SYSTEM_ITEMS
            WHERE INVENTORY_ITEM_ID = :InventoryItemId";

    /// <summary>
    /// Retrieves a customer's name and region details using their unique Customer ID.
    /// </summary>
    public const string GetCustomerNameById = @"
            SELECT DISTINCT customer_id AS CustomerId, customer_name AS CustomerName, REGION AS Region 
            FROM (
                SELECT ra.customer_id, ra.customer_name,
                       (SELECT segment14 FROM ra_territories WHERE territory_id = ras.territory_id) AS REGION 
                FROM ra_customers ra
                JOIN ra_addresses_all ad ON ra.customer_id = ad.customer_id
                JOIN ra_site_uses_all ras ON ad.address_id = ras.address_id
                WHERE ras.site_use_code = 'BILL_TO'
            ) 
            WHERE customer_id = :CustomerId";

}   
export enum AccessTypes {
  NotApplicable = "NotApplicable",
  ReadOnly = "ReadOnly",
  ReadAndWrite = "ReadAndWrite",
}

export interface RequestedFolderItemDto {
  folderPath: string;
  accessType: AccessTypes;
  reason: string;
}

export interface CreateRequestDto {
  items: RequestedFolderItemDto[];
  isAgreed: boolean;
  itsrNo: string;
}

export interface RequestCreationResponseDto {
  masterRequestId: number;
  message: string;
  createdAtUtc: string;
}

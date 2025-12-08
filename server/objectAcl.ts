import { File } from "@google-cloud/storage";

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
  DELETE = "delete",
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  allowedUsers?: string[];
}

export async function getObjectAclPolicy(file: File): Promise<ObjectAclPolicy | null> {
  try {
    const [metadata] = await file.getMetadata();
    const aclPolicyStr = metadata.metadata?.aclPolicy;
    if (!aclPolicyStr) {
      return null;
    }
    return JSON.parse(aclPolicyStr) as ObjectAclPolicy;
  } catch {
    return null;
  }
}

export async function setObjectAclPolicy(file: File, policy: ObjectAclPolicy): Promise<void> {
  await file.setMetadata({
    metadata: {
      aclPolicy: JSON.stringify(policy),
    },
  });
}

export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  
  if (!aclPolicy) {
    return false;
  }

  if (aclPolicy.visibility === "public" && requestedPermission === ObjectPermission.READ) {
    return true;
  }

  if (!userId) {
    return false;
  }

  if (aclPolicy.owner === userId) {
    return true;
  }

  if (aclPolicy.allowedUsers?.includes(userId)) {
    return requestedPermission === ObjectPermission.READ;
  }

  return false;
}

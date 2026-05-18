import { prisma } from "@atomberg/database";

export async function createAuditLog({
  entityType,
  entityId,
  fieldName,
  oldValue,
  newValue,
  changedById,
}: {
  entityType: string;
  entityId: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedById: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        fieldName,
        oldValue,
        newValue,
        changedById,
      },
    });
  } catch (err) {
    // Non-blocking — audit log failure should not crash the main operation
    console.error("Audit log error:", err);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requireLearner } from "@/lib/auth/session";
import { isGroupFormationOpen } from "@/lib/domain/cutoffs";
import {
  serviceCreateGroupWithMembers,
  serviceJoinGroup,
  serviceLeaveGroup,
  serviceSetPic,
  servicePicAddMember,
  servicePicRemoveMember,
} from "@/lib/db/groupMembers";
import { adminUpdateGroup } from "@/lib/db/groups";
import { setParticipationMode } from "@/lib/db/participationMode";
import {
  CreateGroupFormSchema,
  EditGroupFormSchema,
  type CreateGroupFormInput,
  type EditGroupFormInput,
} from "@/lib/schemas/group";

export type ActionResult = { ok: true } | { ok: false; error: string };

function cutoffGuard(): ActionResult | null {
  if (!isGroupFormationOpen()) {
    return { ok: false, error: "Group formation is closed" };
  }
  return null;
}

// Explicitly opt in as an individual participant.
export async function chooseIndividual(): Promise<ActionResult> {
  const guard = cutoffGuard();
  if (guard) return guard;

  try {
    const user = await requireLearner();
    await setParticipationMode(user.id, "individual");
    revalidatePath("/group");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

// Leave the current group and switch to solo.
export async function switchToSolo(groupId: string): Promise<ActionResult> {
  const guard = cutoffGuard();
  if (guard) return guard;

  try {
    const user = await requireLearner();
    await serviceLeaveGroup(user.id, groupId);
    await setParticipationMode(user.id, "individual");
    revalidatePath("/group");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

export async function createGroup(data: CreateGroupFormInput): Promise<ActionResult> {
  const guard = cutoffGuard();
  if (guard) return guard;

  try {
    const user = await requireLearner();
    const parsed = CreateGroupFormSchema.parse(data);
    await serviceCreateGroupWithMembers(
      { name: parsed.name, project_idea: parsed.project_idea },
      user.id,
      parsed.invited_user_ids
    );
    // Clear any solo flag — group membership is now the source of truth.
    await setParticipationMode(user.id, null);
    revalidatePath("/group");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

export async function joinGroup(groupId: string): Promise<ActionResult> {
  const guard = cutoffGuard();
  if (guard) return guard;

  try {
    const user = await requireLearner();
    await serviceJoinGroup(user.id, groupId);
    // Clear any solo flag.
    await setParticipationMode(user.id, null);
    revalidatePath("/group");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

export async function editGroup(groupId: string, data: EditGroupFormInput): Promise<ActionResult> {
  const guard = cutoffGuard();
  if (guard) return guard;

  try {
    const user = await requireLearner();
    const parsed = EditGroupFormSchema.parse(data);

    await adminUpdateGroup(groupId, {
      name: parsed.name,
      project_idea: parsed.project_idea,
    });

    await serviceSetPic(groupId, parsed.pic_user_id, user.id);

    revalidatePath("/group");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

export async function setPic(groupId: string, newPicUserId: string): Promise<ActionResult> {
  const guard = cutoffGuard();
  if (guard) return guard;

  try {
    const user = await requireLearner();
    await serviceSetPic(groupId, newPicUserId, user.id);
    revalidatePath("/group");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

export async function leaveGroup(groupId: string): Promise<ActionResult> {
  const guard = cutoffGuard();
  if (guard) return guard;

  try {
    const user = await requireLearner();
    await serviceLeaveGroup(user.id, groupId);
    revalidatePath("/group");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

// PIC-only: add a learner to the group.
export async function addGroupMemberAction(groupId: string, userId: string): Promise<ActionResult> {
  const guard = cutoffGuard();
  if (guard) return guard;

  try {
    const caller = await requireLearner();
    await servicePicAddMember(groupId, userId, caller.id);
    revalidatePath("/group");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

// PIC-only: remove a member from the group.
export async function removeGroupMemberAction(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  const guard = cutoffGuard();
  if (guard) return guard;

  try {
    const caller = await requireLearner();
    await servicePicRemoveMember(groupId, userId, caller.id);
    revalidatePath("/group");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

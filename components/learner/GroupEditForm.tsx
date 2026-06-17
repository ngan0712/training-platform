"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MemberSelect } from "@/components/learner/MemberSelect";
import { PicToggle } from "@/components/learner/PicToggle";
import {
  CreateGroupFormSchema,
  EditGroupFormSchema,
  type CreateGroupFormInput,
  type EditGroupFormInput,
} from "@/lib/schemas/group";
import {
  createGroup,
  editGroup,
  addGroupMemberAction,
  removeGroupMemberAction,
} from "@/app/(learner)/group/actions";
import type { GroupMemberDetails } from "@/lib/db/groups";

type CreateProps = {
  mode: "create";
  availableLearners: { id: string; name: string; email: string }[];
};

type EditProps = {
  mode: "edit";
  groupId: string;
  defaultValues: EditGroupFormInput;
  members: GroupMemberDetails[];
  isPic: boolean;
  availableLearners: { id: string; name: string; email: string }[];
};

type Props = CreateProps | EditProps;

export function GroupEditForm(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (props.mode === "create") {
    return (
      <CreateForm
        availableLearners={props.availableLearners}
        router={router}
        pending={pending}
        startTransition={startTransition}
      />
    );
  }
  return (
    <EditForm {...props} router={router} pending={pending} startTransition={startTransition} />
  );
}

type TransitionFn = (fn: () => void) => void;

function CreateForm({
  availableLearners,
  router,
  pending,
  startTransition,
}: {
  availableLearners: { id: string; name: string; email: string }[];
  router: AppRouterInstance;
  pending: boolean;
  startTransition: TransitionFn;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupFormInput>({
    resolver: zodResolver(CreateGroupFormSchema),
    defaultValues: { name: "", project_idea: "", invited_user_ids: [] },
  });

  function onSubmit(values: CreateGroupFormInput) {
    startTransition(async () => {
      const result = await createGroup(values);
      if (result.ok) {
        toast.success("Group created!");
        router.push("/group");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="group-name">
          Group name
        </label>
        <Input id="group-name" placeholder="e.g. Team Thunderbirds" {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="project-idea">
          Project idea <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Textarea
          id="project-idea"
          placeholder="Briefly describe your capstone project idea…"
          rows={4}
          {...register("project_idea")}
        />
        {errors.project_idea && (
          <p className="text-destructive text-xs">{errors.project_idea.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Invite members{" "}
          <span className="text-muted-foreground font-normal">
            (up to 4, you are auto-included)
          </span>
        </label>
        <Controller
          control={control}
          name="invited_user_ids"
          render={({ field }) => (
            <MemberSelect
              learners={availableLearners}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.invited_user_ids && (
          <p className="text-destructive text-xs">{errors.invited_user_ids.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create group"}
      </Button>
    </Form>
  );
}

function EditForm({
  groupId,
  defaultValues,
  members,
  isPic,
  availableLearners,
  router,
  pending,
  startTransition,
}: EditProps & {
  router: AppRouterInstance;
  pending: boolean;
  startTransition: TransitionFn;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditGroupFormInput>({
    resolver: zodResolver(EditGroupFormSchema),
    defaultValues,
  });

  function onSubmit(values: EditGroupFormInput) {
    startTransition(async () => {
      const result = await editGroup(groupId, values);
      if (result.ok) {
        toast.success("Group updated");
        router.push("/group");
      } else {
        toast.error(result.error);
      }
    });
  }

  const picMembers = members.map((m) => ({ userId: m.userId, name: m.name }));

  return (
    <div className="space-y-6">
      <Form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="group-name-edit">
            Group name
          </label>
          <Input id="group-name-edit" {...register("name")} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="project-idea-edit">
            Project idea
          </label>
          <Textarea id="project-idea-edit" rows={4} {...register("project_idea")} />
          {errors.project_idea && (
            <p className="text-destructive text-xs">{errors.project_idea.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Project-in-charge (PIC)</label>
          <Controller
            control={control}
            name="pic_user_id"
            render={({ field }) => (
              <PicToggle members={picMembers} value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.pic_user_id && (
            <p className="text-destructive text-xs">{errors.pic_user_id.message}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/group")}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Form>

      {isPic && (
        <MemberManagement
          groupId={groupId}
          members={members}
          availableLearners={availableLearners}
        />
      )}
    </div>
  );
}

function MemberManagement({
  groupId,
  members,
  availableLearners,
}: {
  groupId: string;
  members: GroupMemberDetails[];
  availableLearners: { id: string; name: string; email: string }[];
}) {
  const [removePending, startRemove] = useTransition();
  const [addPending, startAdd] = useTransition();
  const [addSelected, setAddSelected] = useState<string[]>([]);

  function handleRemove(userId: string, name: string) {
    startRemove(async () => {
      const result = await removeGroupMemberAction(groupId, userId);
      if (result.ok) {
        toast.success(`${name} removed from group`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleAdd() {
    if (addSelected.length === 0) return;
    startAdd(async () => {
      for (const uid of addSelected) {
        const result = await addGroupMemberAction(groupId, uid);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
      }
      toast.success(`${addSelected.length} member${addSelected.length > 1 ? "s" : ""} added`);
      setAddSelected([]);
    });
  }

  // Only non-PIC members can be removed by the PIC (PIC can't remove self).
  const removableMembers = members.filter((m) => !m.isPic);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">Manage members (PIC only)</h3>

      {removableMembers.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Current members
          </p>
          <ul className="space-y-1.5">
            {removableMembers.map((m) => (
              <li
                key={m.userId}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="text-sm">{m.name || m.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-7 px-2"
                  disabled={removePending}
                  onClick={() => handleRemove(m.userId, m.name || m.email)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {availableLearners.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Add members
          </p>
          <MemberSelect
            learners={availableLearners}
            value={addSelected}
            onChange={setAddSelected}
            max={5 - members.length}
          />
          {addSelected.length > 0 && (
            <Button size="sm" className="w-full" disabled={addPending} onClick={handleAdd}>
              <UserPlus className="mr-2 h-4 w-4" />
              {addPending
                ? "Adding…"
                : `Add ${addSelected.length} member${addSelected.length > 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      )}

      {availableLearners.length === 0 && removableMembers.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No changes available — group is full or all learners are already assigned.
        </p>
      )}
    </div>
  );
}

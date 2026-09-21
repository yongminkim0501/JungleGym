"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { queryKeys, sessionQueryOptions } from "@/entities";
import { api, ApiError } from "@/shared/api";
import { Avatar, ButtonLink } from "@/shared/ui";
import { notify } from "@/shared/notifications";

export function Navigation() {
  const { data: user } = useSuspenseQuery(sessionQueryOptions());
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const logout = useMutation({
    mutationFn: async () => {
      try {
        await api.logout();
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.removeQueries({ queryKey: queryKeys.dashboard });
      queryClient.removeQueries({ queryKey: queryKeys.visits });
      queryClient.getMutationCache().clear();
      queryClient.setQueryData(sessionQueryOptions().queryKey, null);
      setOpen(false);
      router.replace("/login");
    },
    onError: (error) =>
      notify.error(
        error instanceof ApiError
          ? error.message
          : "로그아웃하지 못했습니다. 다시 시도해 주세요.",
      ),
  });

  if (!user)
    return (
      <div className="flex items-center gap-2">
        <ButtonLink
          variant="secondary"
          size="plain"
          href="/register"
          className="rounded-lg bg-neutral-100 px-4 py-1.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-200/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500"
        >
          회원가입
        </ButtonLink>
        <ButtonLink
          variant="brand"
          size="plain"
          href="/login"
          className="rounded-lg bg-[#05D082] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#05D082]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500"
        >
          로그인
        </ButtonLink>
      </div>
    );

  return (
    <DropdownMenu.Root
      open={open}
      onOpenChange={(next) => {
        if (!logout.isPending) setOpen(next);
      }}
    >
      <DropdownMenu.Trigger
        className="flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
        aria-label="프로필 메뉴 열기"
      >
        <Avatar
          name={user.nickname}
          imageUrl={user.profileImageUrl}
          className="h-8 w-8"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="motion-menu z-40 w-[200px] rounded-2xl border border-neutral-100 bg-white text-sm text-neutral-700 shadow-lg"
          onEscapeKeyDown={(event) => {
            if (logout.isPending) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (logout.isPending) event.preventDefault();
          }}
        >
          <DropdownMenu.Label className="flex w-full items-center break-words px-4 py-4 font-semibold">
            {user.nickname}님 환영합니다.
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="h-px bg-neutral-100" />
          <DropdownMenu.Group className="flex flex-col gap-1 px-2 py-2">
            <DropdownMenu.Item asChild>
              <Link
                className="block rounded-xl px-3 py-2 outline-none data-highlighted:bg-neutral-100"
                href="/mypage/info"
              >
                내 프로필
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                className="block rounded-xl px-3 py-2 outline-none data-highlighted:bg-neutral-100"
                href="/mypage/history"
              >
                활동기록
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Group>
          <DropdownMenu.Separator className="h-px bg-neutral-100" />
          <div className="px-2 py-2">
            <DropdownMenu.Item
              disabled={logout.isPending}
              onSelect={(event) => {
                event.preventDefault();
                logout.mutate();
              }}
              className="flex cursor-pointer items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-red-500 outline-none data-disabled:cursor-wait data-disabled:opacity-60 data-highlighted:bg-red-100"
            >
              {logout.isPending ? "로그아웃 중…" : "로그아웃"}
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              </svg>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

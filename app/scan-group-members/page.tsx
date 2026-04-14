"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScanGroupMembersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/tien-ich/scan-group-members");
  }, [router]);
  return null;
}

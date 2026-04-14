import { redirect } from "next/navigation";

export default function Home() {
  // Will always redirect — actual auth check is done in each page
  redirect("/login");
}

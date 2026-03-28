import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Steve",
  description: "Ready to take your trading to the next level? Reach out to Steve for personalized mentorship, group cohorts, or help setting up your Deriv account.",
};

export default function ContactPage() {
  return <ContactClient />;
}

import type { Metadata } from "next";
import { BookingClient } from "./BookingClient";

export const metadata: Metadata = {
  title: "Book a Session",
  description: "Schedule your trading mentorship session or join a group cohort. Choose your preferred time and start your journey with Deriv Champions.",
};

export default function BookingPage() {
  return <BookingClient />;
}

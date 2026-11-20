/**
 * Reserved placement for future non-gameplay ads.
 * Never mount this inside active Brain/Chaos/Bluff play views.
 */
export function AdSlot({
  placement,
}: {
  placement: "landing" | "between_games";
}) {
  if (process.env.NODE_ENV === "production") {
    // Intentionally empty in MVP — wire an ad provider later by placement.
    return null;
  }
  return (
    <div
      data-ad-slot={placement}
      className="hidden"
      aria-hidden
    />
  );
}

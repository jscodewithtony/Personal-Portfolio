// Replaces the default Sanity logo in the Studio's top nav with a
// wordmark matching the public site's header branding (Header.jsx:
// "I'M / TONY" stacked, font-display font-black uppercase).
export default function StudioLogo() {
  return (
    <span
      style={{
        fontFamily:
          "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
        fontWeight: 900,
        fontSize: "13px",
        lineHeight: 0.95,
        letterSpacing: "-0.01em",
        textTransform: "uppercase",
        color: "#f3efe3",
        display: "block",
      }}
    >
      I&rsquo;m
      <br />
      Tony
    </span>
  );
}

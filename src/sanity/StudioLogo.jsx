import Logo from "../components/Logo";

// Replaces the default Sanity logo in the Studio's top nav with the
// custom SVG branding matching the public site's logo.
export default function StudioLogo() {
  return (
    <Logo
      className="w-auto text-[#f3efe3]"
      style={{ height: "22px" }}
    />
  );
}

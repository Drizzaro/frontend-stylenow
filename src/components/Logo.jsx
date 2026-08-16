import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

export function Logo({ className = "h-9", linkTo = "/", testId = "brand-logo" }) {
    const { resolved } = useTheme();
    const src = resolved === "dark" ? "/assets/logo-dark.png" : "/assets/logo-light.png";
    const img = (
        <img
            src={src}
            alt="StyleNow"
            data-testid={testId}
            className={`${className} w-auto select-none rounded-md object-contain`}
            draggable={false}
        />
    );
    return linkTo ? <Link to={linkTo} aria-label="StyleNow home">{img}</Link> : img;
}

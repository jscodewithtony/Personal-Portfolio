import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";

const DEFAULT_URLS = [
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8e0d22a8-ac82-4893-90d8-3403f80ec600/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/d6af07a0-4dc5-4de4-07b1-9d2ad6100000/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/c083d83a-f5a4-4434-989f-4eaa9bbe7500/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/93bad0e0-e2ab-4e21-de9c-4cb54b028f00/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/09a59a65-3c07-4500-f72c-68c824168c00/w=800",
];

const TRANSITION = { type: "spring", stiffness: 300, damping: 30 };

const srcOf = (img) =>
    typeof img === "string" ? img : (img?.src ?? "");

function TrailImage({
    img,
    imageWidth,
    imageHeight,
    radius,
    fit,
    position,
    urls,
    visibleFor,
    onRemove,
}) {
    const [state, setState] = useState("entering");

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setState("exiting");
        }, visibleFor * 1000);

        // 800ms buffer for exit animation transition
        const timer2 = setTimeout(() => {
            onRemove(img.id);
        }, visibleFor * 1000 + 800);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [img.id, visibleFor, onRemove]);

    return (
        <motion.div
            initial={{
                opacity: 0,
                scale: 0.5,
                filter: "blur(10px)",
                x: img.x - imageWidth / 2,
                y: img.y - imageHeight / 2,
            }}
            animate={{
                opacity: state === "entering" ? 1 : 0,
                scale: state === "entering" ? 1 : 0.5,
                filter: state === "entering" ? "blur(0px)" : "blur(10px)",
                x: img.x - imageWidth / 2,
                y: img.y - imageHeight / 2,
            }}
            transition={TRANSITION}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                backgroundImage: `url(${urls[img.position]})`,
                backgroundSize: fit,
                backgroundPosition:
                    fit === "cover" ? `center ${position}` : "center",
                backgroundRepeat: "no-repeat",
                borderRadius: `${radius}px`,
                pointerEvents: "none",
            }}
        />
    );
}

export default function CursorImageTrail(props) {
    const {
        images = DEFAULT_URLS,
        imageWidth = 150,
        imageHeight = 200,
        radius = 8,
        fit = "cover",
        position = "center",
        frequency = 35,
        visibleFor = 1,
        showLabel = false,
        labelText = "Hover Me",
        labelColor = "#ffffff",
        labelFont = {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 60,
            lineHeight: "1.5em",
            letterSpacing: "0em",
            textAlign: "left",
        },
        ...rest
    } = props;

    const urls = useMemo(() => {
        const list = (images ?? []).map(srcOf).filter(Boolean);
        return list.length ? list : DEFAULT_URLS;
    }, [images]);

    const threshold = 200 - ((frequency - 1) * 199) / 49;

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeImages, setActiveImages] = useState([]);

    const handleMouseMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setMousePos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        });
        setIsHovering(true);
    };
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    const handleRemove = useCallback((id) => {
        setActiveImages((prev) => prev.filter((img) => img.id !== id));
    }, []);

    // Sync hover state with body dataset to stop canvas cursor
    useEffect(() => {
        if (isHovering) {
            document.body.dataset.cursorTrailHover = "true";
        } else {
            document.body.dataset.cursorTrailHover = "false";
        }
    }, [isHovering]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.dataset.cursorTrailHover = "false";
        };
    }, []);

    useEffect(() => {
        if (!isHovering || urls.length === 0) return;
        const lastImage = activeImages[activeImages.length - 1];
        const distance = lastImage
            ? Math.hypot(mousePos.x - lastImage.x, mousePos.y - lastImage.y)
            : Infinity;
        if (distance <= threshold) return;

        const newImage = {
            id: Math.random(),
            position: currentImageIndex,
            x: mousePos.x,
            y: mousePos.y,
        };
        setActiveImages((prev) => [...prev, newImage]);
        setCurrentImageIndex((prev) => (prev + 1) % urls.length);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mousePos, isHovering, urls, threshold, currentImageIndex]);

    return (
        <div
            {...rest}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                height: "100%",
                ...rest.style,
            }}
        >
            {showLabel && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        userSelect: "none",
                        ...labelFont,
                        color: labelColor,
                    }}
                >
                    {labelText}
                </div>
            )}

            {rest.children}

            {activeImages.map((img) => (
                <TrailImage
                    key={img.id}
                    img={img}
                    imageWidth={imageWidth}
                    imageHeight={imageHeight}
                    radius={radius}
                    fit={fit}
                    position={position}
                    urls={urls}
                    visibleFor={visibleFor}
                    onRemove={handleRemove}
                />
            ))}
        </div>
    );
}

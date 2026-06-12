import { motion } from "framer-motion";

const variants = {
    hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
    },
};

export const Reveal = ({ children, delay = 0, as = "div", className = "" }) => {
    const Comp = motion[as] || motion.div;
    return (
        <Comp
            className={className}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={variants}
            transition={{ delay }}
        >
            {children}
        </Comp>
    );
};

export const RevealText = ({ text, className = "", delay = 0, stagger = 0.06 }) => {
    const words = text.split(" ");
    return (
        <motion.span
            className={className}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ staggerChildren: stagger, delayChildren: delay }}
        >
            {words.map((w, i) => (
                <motion.span
                    key={i}
                    className="inline-block"
                    variants={{
                        hidden: { y: "100%", opacity: 0 },
                        show: {
                            y: 0,
                            opacity: 1,
                            transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                        },
                    }}
                >
                    <span className="inline-block overflow-hidden">{w}</span>
                    {i < words.length - 1 && <span>&nbsp;</span>}
                </motion.span>
            ))}
        </motion.span>
    );
};

export default Reveal;

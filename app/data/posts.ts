export type Post = {
  id: string;
  name: string;
  quote: string;
  art: string;
  dot: string;
  featured?: boolean;
};

export function getGradient(valence: number, arousal: number) {
  const hue = valence > 0 ? (arousal > 0 ? 170 : 210) : (arousal > 0 ? 330 : 270);
  const core = `hsl(${hue}, 80%, 65%)`;
  const edge = `hsl(${hue}, 90%, 15%)`;
  return `radial-gradient(circle at 50% 50%, ${core} 0%, ${edge} 100%)`;
}

export const posts: Post[] = [
  {
    id: "ishaan",
    name: "Ishaan",
    quote: "grateful for everything today, thanks for asking",
    art: "radial-gradient(circle at 50% 55%, rgba(94,234,212,.95) 0%, rgba(13,60,60,.9) 35%, rgba(4,10,18,.98) 72%)",
    dot: "bg-teal-300",
  },
  {
    id: "ritika",
    name: "Ritika",
    quote: "was a lot today but sitting with it now",
    art: "radial-gradient(circle at 55% 45%, rgba(192,132,252,.9) 0%, rgba(60,10,80,.85) 38%, rgba(5,5,15,.98) 75%)",
    dot: "bg-purple-400",
  },
  {
    id: "devansh",
    name: "Devansh",
    quote: "small win, actually took a break at 3pm",
    art: "radial-gradient(circle at 50% 55%, rgba(45,212,191,.9) 0%, rgba(8,40,38,.9) 40%, rgba(3,8,14,.98) 75%)",
    dot: "bg-teal-400",
  },
  {
    id: "ayesha",
    name: "Ayesha",
    quote: "not sure what this is, just logging it",
    art: "radial-gradient(circle at 50% 60%, rgba(147,197,253,.9) 0%, rgba(20,40,90,.85) 42%, rgba(3,6,16,.98) 78%)",
    dot: "bg-blue-400",
  },
  {
    id: "kabir",
    name: "Kabir",
    quote: "good day, oddly calm",
    art: "radial-gradient(circle at 50% 55%, rgba(125,211,252,.9) 0%, rgba(15,45,70,.88) 42%, rgba(3,7,15,.98) 76%)",
    dot: "bg-sky-400",
  },
  {
    id: "meher",
    name: "Meher",
    quote: "heavy morning, better by evening",
    art: "radial-gradient(circle at 55% 55%, rgba(168,85,247,.9) 0%, rgba(50,15,80,.85) 42%, rgba(6,4,16,.98) 78%)",
    dot: "bg-purple-500",
  },
];

import { Link } from "react-router";

export default function RemixLink({ href, ...props }: any) {
    return <Link {...props} to={href} />;
}

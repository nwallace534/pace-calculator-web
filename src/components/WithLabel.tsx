import { ReactNode } from "react";

type WithLabelProps = {
  id: string;
  name: string;
  children: ReactNode;
};

const WithLabel = ({ id, name, children }: WithLabelProps) => (
  <label htmlFor={id} className="text-small">
    {/* Wrap the label text so it can't be accidentally selected while using nearby spinner buttons. */}
    <span style={{ userSelect: "none", WebkitUserSelect: "none" }}>{name}</span>
    {children}
  </label>
);

export default WithLabel;

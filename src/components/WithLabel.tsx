import { ReactNode } from "react";

type WithLabelProps = {
  id: string;
  name: string;
  children: ReactNode;
};

const WithLabel = ({ id, name, children }: WithLabelProps) => (
  <label htmlFor={id} className="text-small">
    {/* Wrap the label text so it can't be accidentally selected while
        repeatedly tapping the adjacent spinner buttons. The input still
        accepts text selection — only the label is locked. */}
    <span style={{ userSelect: "none", WebkitUserSelect: "none" }}>{name}</span>
    {children}
  </label>
);

export default WithLabel;

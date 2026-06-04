import { ReactNode } from "react";

type WithLabelProps = {
  id: string;
  name: string;
  children: ReactNode;
};

const WithLabel = ({ id, name, children }: WithLabelProps) => (
  <label htmlFor={id} className="text-small">
    {name}
    {children}
  </label>
);

export default WithLabel;

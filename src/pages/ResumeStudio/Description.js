/** @jsx jsx */
import { jsx } from "theme-ui";
import { useState } from "react";
import Highlighter from "react-highlight-words";
import EllipsisTrigger from "./EllipsisTrigger";

export default ({ description, keywords = [], maxLines = 15, ...props }) => {
  const [expanded, setExpanded] = useState(false);
  const ellipsisStyle = expanded
    ? {}
    : {
        overflow: "hidden",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: `${maxLines}`,
      };

  return (
    <div>
      <Highlighter
        highlightClassName="keyword-highlight"
        searchWords={keywords}
        textToHighlight={description}
        sx={{
          "*": {
            fontSize: 2,
          },
          whiteSpace: "pre-line",
          wordBreak: "break-word",
          ...ellipsisStyle,
          ".keyword-highlight": {
            bg: "primary",
            color: "white",
          },
        }}
        {...props}
      />
      <div sx={{ textAlign: "center", mb: 3 }}>
        <EllipsisTrigger expanded={expanded} setExpanded={setExpanded} />
      </div>
    </div>
  );
};

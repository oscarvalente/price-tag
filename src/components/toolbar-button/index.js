import React from "react";

import styles from "./toolbar-button.css";

const ToolbarButton = props => (
    <div className={styles["toolbar-button-container"]}>
        {props.title}
        <SVGInline src={props.svgPath} fill={props.fill} title={props.title}/>
    </div>
);

export default ToolbarButton;



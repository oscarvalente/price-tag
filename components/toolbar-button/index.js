import React from "react";

import styles from "./toolbar-button.css";

class ToolbarButton extends React.Component {
    constructor(svgPath, title, fill) {
        super({svgPath, title, fill});
    }

    render() {
        return (
            <div className={styles["toolbar-button-container"]}>
                {this.props.title}
                <SVGInline src={this.props.svgPath} fill={this.props.fill} title={this.props.title}/>
            </div>
        );
    }
}

export default ToolbarButton;



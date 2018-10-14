import React, {Component} from "react";

import styles from "./toolbar-button.scss";

class ToolbarButton extends Component {
    render() {
        const buttonStatus = `${this.props.id}-${this.props.status}`;
        return (
            <div
                id={styles[this.props.id]}
                className={`${styles["toolbar-button-container"]} ${styles[buttonStatus]}`}
                onClick={this.props.onClick}
                title={this.props.title}>
            </div>
        );
    }
}

export default ToolbarButton;



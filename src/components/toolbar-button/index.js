import React, {Component} from "react";

import styles from "./toolbar-button.scss";

class ToolbarButton extends Component {
    render() {
        return (
            <div
                className={`${styles["toolbar-button-container"]} ${styles[this.props.id]} ${styles[this.props.status]}`}
                onClick={this.props.onClick}
                onMouseOver={this.props.onMouseOver}
                onMouseOut={this.props.onMouseOut}
                title={this.props.title}>
            </div>
        );
    }
}

export default ToolbarButton;



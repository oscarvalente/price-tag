import React, {Component} from "react";
import PropTypes from "prop-types";

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

ToolbarButton.propTypes = {
    id: PropTypes.string,
    status: PropTypes.string,
    title: PropTypes.string,
    onClick: PropTypes.func,
    onMouseOver: PropTypes.func,
    onMouseOut: PropTypes.func
};

export default ToolbarButton;

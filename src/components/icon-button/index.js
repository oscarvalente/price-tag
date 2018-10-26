import React, {Component} from "react";
import PropTypes from "prop-types";

import styles from "./icon-button.scss";

class IconButton extends Component {
    render() {
        return (
            <div className={`${styles.icon} ${styles[this.props.icon]} ${styles[this.props.state]}`}
                 title={this.props.title}
                 onClick={this.props.onClick}></div>
        );
    }
}

IconButton.propTypes = {
    icon: PropTypes.string,
    title: PropTypes.string,
    state: PropTypes.string,
    onClick: PropTypes.func
};

export default IconButton;

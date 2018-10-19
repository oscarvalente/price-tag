import React, {Component} from "react";
import PropTypes from "prop-types";

import styles from "./icon-link.scss";

class IconLink extends Component {
    render() {
        return (
            <a className={styles["icon-link-container"]} href={this.props.href}>
                <span className={`${styles.icon} ${styles[this.props.icon]}`}></span>
                <span className={styles.title}>{this.props.title}</span>
            </a>
        );
    }
}

IconLink.propTypes = {
    href: PropTypes.string,
    icon: PropTypes.string,
    title: PropTypes.string
};

export default IconLink;

import React, {Component} from "react";
import PropTypes from "prop-types";

import styles from "./icon-title.scss";

class IconTitle extends Component {
    render() {
        return (
            <div className={styles["title-container"]}>
                <div className={`${styles.icon} ${styles[this.props.icon]}`}></div>
                <h3 className={styles.title}>{this.props.title}</h3>
            </div>
        );
    }
}

IconTitle.propTypes = {
    icon: PropTypes.string,
    title: PropTypes.string
};

export default IconTitle;

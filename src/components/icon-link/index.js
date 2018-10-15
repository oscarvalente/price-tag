import React, {Component} from "react";

import styles from "./icon-link.scss";

class IconLink extends Component {
    render() {
        return (
            <a className={styles["icon-link-container"]} href={this.props.href}>
                <span className={`${styles["icon"]} ${styles[this.props.icon]}`}></span>
                <span className={styles["title"]}>{this.props.title}</span>
            </a>
        );
    }
}

export default IconLink;

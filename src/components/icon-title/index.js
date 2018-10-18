import React, {Component} from "react";

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

export default IconTitle;

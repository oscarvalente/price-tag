import React from "react";

import styles from "./toolbar.css";

import ToolbarButton from "../toolbar-button/index";

class Toolbar extends React.Component {
    render() {
        return (
            <section className={styles["tracking-container"]}>
                <ul className={styles["tracking-buttons"]}>
                    <li id="record-btn">
                        <ToolbarButton/>
                    </li>
                    <li id="auto-save-btn">
                        <ToolbarButton/>
                    </li>
                    <li id="price-update-btn">
                        <ToolbarButton/>
                    </li>
                </ul>
            </section>
        );
    }
}

export default Toolbar;



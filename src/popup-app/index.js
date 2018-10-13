import React from "react";
import ToolbarButton from "../components/toolbar-button";

import styles from "./popup-app.css";

class Popup extends React.Component {
    render() {
        return (
            <section className={styles["tracking-container"]}>
                <ToolbarButton />
            </section>
        );
    }
}

export default Popup;

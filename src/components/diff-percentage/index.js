import React, {Component} from "react";

import styles from "./diff-percentage.scss";

function getSvgConfig(value) {
    let percentage = parseInt(value, 10);
    // default: 1 digit
    let x = 110;
    let fontSize = 180;
    if (percentage >= 10 || percentage <= -10) {
        x = 50;
        fontSize = 175;
    }
    if (percentage >= 100 || percentage <= -100) {
        x = 60;
        fontSize = 170;
    }
    if (percentage > 0) {
        percentage = `+${percentage}`;
    }

    return {
        x,
        fontSize,
        percentage
    };
}

class DiffPercentage extends Component {
    render() {
        const {x, fontSize, percentage} = getSvgConfig(this.props.value);
        return (
            <svg id={styles["icon"]} version="1.1" x="0px" y="0px"
                 viewBox="0 0 512 512">
                <g>
                    <g>
                        <path fill={this.props.backgroundColor}
                              d="M512,256l-44.285-48.343l18.977-62.763l-60.93-24.254L415.626,55.85l-65.416,4.481L312.962,6.364L256,38.888    L199.038,6.364l-37.247,53.967l-65.416-4.482l-10.137,64.789l-60.93,24.254l18.977,62.763L0,256l44.285,48.343l-18.977,62.763    l60.93,24.254l10.137,64.789l65.416-4.481l37.247,53.967L256,473.112l56.962,32.522l37.247-53.967l65.416,4.482l10.136-64.789    l60.93-24.254l-18.977-62.763L512,256z"/>
                    </g>
                </g>
                <g>
                    <g>
                        <text x={x} y="310" fontFamily="Verdana" fontWeight="bold" fontSize={fontSize} fill="#fff1cb"
                              letterSpacing="-10">
                            {percentage}%
                        </text>
                    </g>
                </g>
            </svg>
        );
    }
}

export default DiffPercentage;

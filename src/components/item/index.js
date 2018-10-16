import React, {Component} from "react";

import styles from "./item.scss";

const ItemContext = React.createContext();

const IconContainer = () => {
    return (
        <ItemContext.Consumer>
            {({faviconURL, faviconAlt}) => (
                <div className={styles["item-icon-container"]}>
                    {faviconURL &&
                    <img className={styles["item-icon"]} src={faviconURL} title={faviconAlt}/>
                    }
                </div>
            )}
        </ItemContext.Consumer>
    );
};

const StatusContainer = (props) => {
    return (
        <ItemContext.Consumer>
            {({isWatched, isNotFound, isHigher, isLower}) => (
                <div className={styles["status-container"]}>
                    {isWatched &&
                    <div className={styles["item-watch"]} title={props.watchedTitle}></div>
                    }
                    {isNotFound &&
                    <div className={styles["item-notfound"]} title={props.notFoundTitle}></div>
                    }
                    {isHigher &&
                    <div className={styles["item-priceup"]} title={props.higherTitle}></div>
                    }
                    {isLower &&
                    <div className={styles["item-pricedown"]} title={props.lowerTitle}></div>
                    }
                </div>
            )}
        </ItemContext.Consumer>
    );
};

const LabelContainer = (props) => {
    return (
        <ItemContext.Consumer>
            {({url, currentPrice, targetPrice, diffPercentage, dateTime}) => (
                <a className={styles["item-label-container"]} href={url} title={url} target="_blank">
                    <span className={styles["item-label price"]}>{currentPrice}</span>
                    <div className={styles["item-targetprice-container"]}>
                        {targetPrice}
                    </div>
                    <div className="item-diffperc-container">
                        {diffPercentage && (
                            // TODO: new component <diff SVG>
                            // <DiffPercentage />
                            (diffPercentage > 0 &&
                                <div className={styles["item-diffperc win"]}></div>
                            )
                            ||
                            <div className={styles["item-diffperc lose"]}></div>
                        )}
                    </div>
                    <span className="item-label date">{dateTime}</span>
                </a>
            )}
        </ItemContext.Consumer>
    );
};

class Item extends Component {
    render() {
        return (
            <ItemContext.Provider {...this.props}>
                {this.props.children}
            </ItemContext.Provider>
        );
    }
}

export default Item;
export {
    IconContainer,
    StatusContainer,
    LabelContainer
};

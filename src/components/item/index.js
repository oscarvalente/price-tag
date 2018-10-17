import React, {Component} from "react";

import styles from "./item.scss";
import DiffPercentage from "../diff-percentage";

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
            {({url, currentPrice, diffPercentage, dateTime, price: targetPrice}) => (
                <a className={styles["item-label-container"]} href={url} title={url} target="_blank">
                    <span className={`${styles["item-label"]} ${styles.price}`}>{currentPrice}</span>
                    <div className={styles["item-targetprice-container"]}>
                        <span className={`${styles["item-label"]} ${styles["target-price"]}`}
                              title={props.targetPriceTitle}>{targetPrice}</span>
                    </div>
                    <div className={styles["item-diffperc-container"]}>
                        {diffPercentage && (
                            (diffPercentage > 0 &&
                                <DiffPercentage backgroundColor="green" value={diffPercentage}/>
                            )
                            ||
                            <DiffPercentage backgroundColor="red" value={diffPercentage}/>
                        )}
                    </div>
                    <span className={`${styles["item-label"]} ${styles["date"]}`}>{dateTime}</span>
                </a>
            )}
        </ItemContext.Consumer>
    );
};

function removeItem(url, callback) {
    chrome.runtime.sendMessage({
        type: "TRACKED_ITEMS.UNFOLLOW",
        payload: {url}
    }, callback);
}

const DeleteButton = (props) => {
    return (
        <ItemContext.Consumer>
            {(({url}) => (
                <div className={styles["item-delete"]}
                     onClick={removeItem.bind(null, url, props.onItemRemoved)}
                     title={props.title}></div>
            ))}
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
    LabelContainer,
    DeleteButton
};

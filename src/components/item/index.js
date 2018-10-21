import React, {Component} from "react";
import PropTypes from "prop-types";

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

StatusContainer.propTypes = {
    watchedTitle: PropTypes.string,
    notFoundTitle: PropTypes.string,
    higherTitle: PropTypes.string,
    lowerTitle: PropTypes.string
};

const LabelContainer = (props) => {
    return (
        <ItemContext.Consumer>
            {({url, currentPrice, diffPercentage, dateTime, price: targetPrice}) => (
                <a className={styles["item-label-container"]} href={url} title={url} target="_blank"
                   rel="noopener noreferrer">
                    <span className={`${styles["item-label"]} ${styles.price}`}>{currentPrice}</span>
                    <div className={styles["item-targetprice-container"]}>
                        {currentPrice !== targetPrice &&
                        <span className={`${styles["item-label"]} ${styles["target-price"]}`}
                              title={props.targetPriceTitle}>{targetPrice}</span>
                        }
                    </div>
                    <div className={styles["item-diffperc-container"]}>
                        {diffPercentage && (
                            (diffPercentage > 0 &&
                                <DiffPercentage backgroundColor="red" value={diffPercentage}/>
                            )
                            ||
                            <DiffPercentage backgroundColor="green" value={diffPercentage}/>
                        )}
                    </div>
                    <span className={`${styles["item-label"]} ${styles["date"]}`}>{dateTime}</span>
                </a>
            )}
        </ItemContext.Consumer>
    );
};

LabelContainer.propTypes = {
    targetPriceTitle: PropTypes.string
};

const DeleteButton = (props) => {
    // TODO: This is generic enough not be in Item Context
    return (
        <ItemContext.Consumer>
            {(() => (
                <div className={styles["item-delete"]}
                     title={props.title}
                     onClick={props.onItemRemoved}></div>
            ))}
        </ItemContext.Consumer>
    );
};

DeleteButton.propTypes = {
    title: PropTypes.string,
    onItemRemoved: PropTypes.func
};

DeleteButton.propTypes = {
    onItemRemoved: PropTypes.func
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

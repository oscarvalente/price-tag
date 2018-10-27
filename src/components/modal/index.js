import React, {Component} from "react";
import PropTypes from "prop-types";
import styles from "./modal.scss";

const ModalContext = React.createContext();

const ModalHeader = (props) => {
    return (
        <ModalContext.Consumer>
            {(() => (
                <div id={styles["modal-header"]}>
                    <h3 id={styles.title}>{props.title}</h3>
                    <div id={styles["close-button"]} onClick={props.onCloseClick}></div>
                </div>
            ))}
        </ModalContext.Consumer>
    );
};

ModalHeader.propTypes = {
    title: PropTypes.string,
    onCloseClick: PropTypes.func
};

const ModalBody = (props) => {
    return (
        <ModalContext.Consumer>
            {(() => (
                <div id={styles["modal-body"]}>
                    <span id={styles.message} dangerouslySetInnerHTML={{__html: props.message}}></span>
                </div>
            ))}
        </ModalContext.Consumer>
    );
};

ModalBody.propTypes = {
    message: PropTypes.string
};

const ModalButton = ({title, onClick}) => {
    return (
        <button className={styles.button} onClick={onClick}>{title}</button>
    );
};

ModalButton.propTypes = {
    title: PropTypes.string,
    onClick: PropTypes.func,
    clickPayload: PropTypes.object
};

const createButtonsList = (buttons, generateOnButtonClickCallback) =>
    buttons.map((title, i) =>
        <ModalButton key={i} title={title} onClick={generateOnButtonClickCallback(i)}/>
    );

const ModalFooter = ({buttons, generateOnButtonClickCallback}) => {
    return (
        <div id={styles["modal-footer"]}>
            {createButtonsList(buttons, generateOnButtonClickCallback)}
        </div>
    );
};

ModalFooter.propTypes = {
    buttons: PropTypes.array,
    generateOnButtonClickCallback: PropTypes.func
};

class Modal extends Component {
    render() {
        return (
            <div id={styles.modal}>
                <ModalContext.Provider {...this.props}>
                    {this.props.children}
                </ModalContext.Provider>
            </div>
        );
    }
}

export default Modal;
export {
    ModalHeader,
    ModalBody,
    ModalFooter
};

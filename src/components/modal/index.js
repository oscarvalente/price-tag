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
                </div>
            ))}
        </ModalContext.Consumer>
    );
};

ModalHeader.propTypes = {
    title: PropTypes.string
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

const createButtonsList = (buttons, generateButtonCallback) =>
    buttons.map((title, i) =>
        <ModalButton key={i} title={title} onClick={generateButtonCallback(i)}/>
    );

const ModalFooter = ({buttons, generateButtonCallback}) => {
    return (
        <div id={styles["modal-footer"]}>
            {createButtonsList(buttons, generateButtonCallback)}
        </div>
    );
};

ModalFooter.propTypes = {
    buttons: PropTypes.array,
    generateButtonCallback: PropTypes.func
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

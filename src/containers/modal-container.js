import React, {Component} from "react";

import Modal, {ModalHeader, ModalBody, ModalFooter} from "../components/modal/index";

class ModalContainer extends Component {
    render() {
        return (
            <Modal>
                <ModalHeader title={this.props.title} onCloseClick={this.props.onCloseClick}/>
                <ModalBody message={this.props.message}/>
                <ModalFooter buttons={this.props.buttons}
                             generateOnButtonClickCallback={this.props.generateOnButtonClickCallback}/>
            </Modal>
        )
    }
}

ModalContainer.propTypes = {
    title: ModalHeader.propTypes.title,
    onCloseClick: ModalHeader.propTypes.onCloseClick,
    message: ModalBody.propTypes.message,
    buttons: ModalFooter.propTypes.buttons,
    generateOnButtonClickCallback: ModalFooter.propTypes.generateOnButtonClickCallback
};

export default ModalContainer;

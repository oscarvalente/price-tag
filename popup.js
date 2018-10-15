import {createElement} from "react";
import {render} from "react-dom";
import Popup from "./src/popup-app";

function bootstrap() {
    render(createElement(Popup), document.getElementById('popup-app'));
}

bootstrap();


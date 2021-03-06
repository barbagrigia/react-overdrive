import React from 'react'
import ReactDOM  from 'react-dom'

const defaultSpeed = 200;
const components = {};

class Overdrive extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
    }

    animate(prevPosition, prevElement) {
        const {speed = defaultSpeed} = this.props;
        const transition = {
            transition: `transform ${speed / 1000}s, opacity ${speed / 1000}s`,
            transformOrigin: '0 0 0'
        };
        const bodyElement = document.createElement('div');
        window.document.body.appendChild(bodyElement);
        this.bodyElement = bodyElement;

        prevPosition.top += window.scrollY;
        const nextPosition = this.getPosition(true);
        const noTransform = 'scaleX(1) scaleY(1) translateX(0px) translateY(0px)';
        const targetScaleX = prevPosition.width / nextPosition.width;
        const targetScaleY = prevPosition.height / nextPosition.height;
        const targetTranslateX = prevPosition.left - nextPosition.left;
        const targetTranslateY = prevPosition.top - nextPosition.top;

        const sourceStart = React.cloneElement(prevElement, {
            key: '1',
            style: {
                ...transition,
                ...prevPosition,
                opacity: 1,
                transform: noTransform
            }
        });

        const sourceEnd = React.cloneElement(prevElement, {
            key: '1',
            style: {
                ...transition,
                ...prevPosition,
                margin: nextPosition.margin,
                opacity: 0,
                transform: `matrix(${1/targetScaleX}, 0, 0, ${1/targetScaleY}, ${-targetTranslateX}, ${-targetTranslateY})`
            }
        });

        const targetStart = React.cloneElement(this.props.children, {
            key: '2',
            style: {
                ...transition,
                ...nextPosition,
                margin: prevPosition.margin,
                opacity: 0,
                transform: `matrix(${targetScaleX}, 0, 0, ${targetScaleY}, ${targetTranslateX}, ${targetTranslateY})`
            }
        });

        const targetEnd = React.cloneElement(this.props.children, {
            key: '2',
            style: {
                ...transition,
                ...nextPosition,
                opacity: 1,
                transform: noTransform
            }
        });

        const start = <div>{sourceStart}{targetStart}</div>;
        const end = <div>{sourceEnd}{targetEnd}</div>;

        this.setState({loading: true});
        ReactDOM.render(start, bodyElement);

        this.animationTimeout = setTimeout(() => {
            this.animationTimeout = null;
            ReactDOM.render(end, bodyElement);
            this.animationTimeout = setTimeout(() => {
                this.animationTimeout = null;
                this.setState({loading: false});
                window.document.body.removeChild(bodyElement);
            }, speed);
        }, 0);
    }

    componentDidMount() {
        const {id, animationDelay} = this.props;
        if (components[id]) {
            const {prevPosition, prevElement} = components[id];
            components[id] = false;
            if (animationDelay) {
                this.animationDelayTimeout = setTimeout(() => {
                    this.animate(prevPosition, prevElement);
                }, animationDelay);
            }
            else {
                this.animate(prevPosition, prevElement);
            }
        }
        else {
            this.setState({loading: false});
        }
    }

    clearAnimations() {
        if (this.animationTimeout) {
            window.document.body.removeChild(this.bodyElement);
        }
        clearTimeout(this.animationDelayTimeout);
        clearTimeout(this.animationTimeout);
    }

    componentWillUnmount() {
        const {id} = this.props;
        const prevElement = React.cloneElement(this.props.children);
        const prevPosition = this.getPosition();
        components[id] = {
            prevPosition,
            prevElement
        };

        this.clearAnimations();

        setTimeout(() => {
            components[id] = false;
        }, 100);
    }

    getPosition(addOffset) {
        const node = this.element;
        const rect = node.getBoundingClientRect();
        const computedStyle = getComputedStyle(node);
        const marginTop = parseInt(computedStyle.marginTop, 10);
        const marginLeft = parseInt(computedStyle.marginLeft, 10);
        return {
            top: (rect.top - marginTop) + ((addOffset ? 1 : 0) * window.scrollY),
            left: (rect.left - marginLeft),
            width: rect.width,
            height: rect.height,
            margin: computedStyle.margin,
            padding: computedStyle.padding,
            borderRadius: computedStyle.borderRadius,
            position: 'absolute'
        };
    }

    render() {
        const {id, speed, animationDelay, style = {}, ...rest} = this.props;
        const newStyle = {
            ...style,
            opacity: (this.state.loading ? 0 : 1)
        };

        return (
            <div ref={c => (this.element = c && c.firstChild)} style={newStyle} {...rest}>
                {this.props.children}
            </div>
        );
    }
}

Overdrive.propTypes = {
    id: React.PropTypes.string.isRequired,
    speed: React.PropTypes.number,
    animationDelay: React.PropTypes.number
};

export default Overdrive;

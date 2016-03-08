import classnames from 'classnames';
import React, {cloneElement, Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {
  resetViewState,
  showAutocompleteMenu,
  hideAutocompleteMenu,
  selectHighlightedItem,
  fetchAutocompleteList,
  setInitialValue,
  setValue
} from '../redux/autocomplete';


// Index that indicates that none of the autocomplete results is
// currently highlighted.
const SENTINEL = -1;

class Autocomplete extends Component {
  static propTypes = {
    children: PropTypes.node,
    classNames: PropTypes.objectOf(PropTypes.string),
    debounceDuration: PropTypes.number,
    getResultItemValue: PropTypes.func.isRequired,
    onEnterKeyDown: PropTypes.func,
    onResultItemClick: PropTypes.func,
    renderBeforeTextBox: PropTypes.func,
    renderAfterTextBox: PropTypes.func,
    renderBeforeResultList: PropTypes.func,
    renderAfterResultList: PropTypes.func,
    renderResultItem: PropTypes.func.isRequired,
    shouldCacheResultList: PropTypes.bool,

    // props from redux state
    highlightedIndex: PropTypes.number,
    initialValue: PropTypes.string,
    isLoading: PropTypes.bool,
    isMenuVisible: PropTypes.bool,
    resultList: PropTypes.array,
    value: PropTypes.string,

    // props from redux dispatch
    fetchAutocompleteList: PropTypes.func.isRequired,
    hideAutocompleteMenu: PropTypes.func.isRequired,
    showAutocompleteMenu: PropTypes.func.isRequired,
    resetViewState: PropTypes.func.isRequired,
    selectHighlightedItem:  PropTypes.func.isRequired,
    setInitialValue: PropTypes.func.isRequired,
    setValue: PropTypes.func.isRequired
  };

  static defaultProps = {
    children: (
      <input aria-autocomplete="both"
        role="combobox"
        type="text" />
    ),
    classNames: {
      isHighlighted: 'isHighlighted',
      isLoading: 'isLoading',
      resultItem: 'resultItem',
      resultList: 'resultList',
      root: 'root',
      textBox: 'textBox'
    },
    debounceDuration: 250,
    shouldCacheResultList: true
  };

  // Returns the value of `state.highlightedIndex` decremented by 1.
  // If necessary, wraps around to the last item, or reverts to `SENTINEL`
  // (ie. no item highlighted).
  decrementHighlightedIndex = () => {
    const {
      highlightedIndex,
      initialValue,
      resultList
    } = this.props;
    switch (highlightedIndex) {
      case SENTINEL:
        return resultList.length - 1;
      case 0:
        return SENTINEL;
      default:
        return highlightedIndex - 1;
    }
  };

  // Returns the value of `state.highlightedIndex` incremented by 1.
  // If necessary, reverts to `SENTINEL` (ie. no item highlighted).
  incrementHighlightedIndex = () => {
    const {
      highlightedIndex,
      initialValue,
      resultList
    } = this.props;
    if (highlightedIndex === resultList.length - 1) {
      return SENTINEL;
    }
    return highlightedIndex + 1;
  };

  // Set the current highlighted item to the item at the given
  // `highlightedIndex`. Set the text box's value to that of the new
  // highlighted item.
  setHighlightedItem = (highlightedIndex) => {
    const {
      initialValue,
      getResultItemValue,
      resultList
    } = this.props;
    
    const isAnyItemHighlighted = highlightedIndex !== SENTINEL;
    const value = isAnyItemHighlighted
      ? getResultItemValue.call(this, resultList[highlightedIndex])
      : initialValue;
    this.props.selectHighlightedItem(highlightedIndex, value);
    
    window.requestAnimationFrame(isAnyItemHighlighted
      ? this.selectTextBoxValue
      : this.moveTextBoxCaretToEnd);
  };

  // Select all the text in the text box.
  selectTextBoxValue = () => {
    const {value} = this.props;
    this.refs.textBox.setSelectionRange(0, value.length);
  };

  // Move the caret in the text box to the end of the text box.
  moveTextBoxCaretToEnd = () => {
    const {value} = this.props;
    const length = value.length;
    this.refs.textBox.setSelectionRange(length, length);
  };

  fetchResultList = (() => {
    let timeout = null;
    const {debounceDuration} = this.props;
    return (value) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        this.props.fetchAutocompleteList(value);
        this.props.showAutocompleteMenu();
      }, debounceDuration);
    };
  })();

  // Reset to the initial state ie. empty text box with no results.
  reset = () => {
    this.props.resetViewState();
  };

  keyDownHandlers = {
    ArrowDown: () => {
      this.setHighlightedItem(this.incrementHighlightedIndex());
    },
    ArrowUp: () => {
      this.setHighlightedItem(this.decrementHighlightedIndex());
    },
    Enter: () => {
      this.handleEnterKeyDown();
    },
    Escape: () => {
      this.props.hideAutocompleteMenu();
      this.refs.textBox.blur();
    }
  };

  handleKeyDown = (event) => {
    const {
      highlightedIndex,
      value
    } = this.props;
    const keyDownHandler = this.keyDownHandlers[event.key];
    if (keyDownHandler) {
      // Save the initial user input value.
      if (highlightedIndex === SENTINEL) {
        this.props.setInitialValue(value);
      }
      keyDownHandler(event);
    }
  };

  // Note that `handleChange` is only called if the text box value has actually
  // changed. It is not called when we hit the up/down arrows.
  handleChange = (event) => {
    const value = event.target.value;
    if (value.trim() === '') {
      this.reset();
      return;
    }
    this.props.setValue(value);
    this.fetchResultList(value);
  };

  handleBlur = () => {
    this.props.hideAutocompleteMenu();
  };

  handleEnterKeyDown = () => {
    const {
      highlightedIndex,
      onEnterKeyDown,
      resultList,
      value
    } = this.props;
    onEnterKeyDown && onEnterKeyDown.call(this, value, resultList[highlightedIndex]);
  };

  handleFocus = () => {
    this.props.showAutocompleteMenu();
  };

  handleResultItemClick = (index) => {
    const {
      getResultItemValue,
      onResultItemClick,
      resultList
    } = this.props;
    const result = resultList[index];
    onResultItemClick && onResultItemClick(getResultItemValue.call(this, result), result);
    this.setHighlightedItem(index);
  };

  // Prevent the text box from losing focus when we click outside the text
  // box (eg. click on the result menu).
  handleMouseDown = (event) => {
    event.preventDefault();
  };

  render() {
    const {
      children,
      classNames,
      renderBeforeTextBox,
      renderAfterTextBox,
      renderBeforeResultList,
      renderAfterResultList,
      renderResultItem
    } = this.props;
    const {
      highlightedIndex,
      isLoading,
      isMenuVisible,
      resultList,
      value
    } = this.props;

    const onMouseDownProp = {
      onMouseDown: this.handleMouseDown
    };

    return (
      <div className={classnames(classNames.root, isLoading && classNames.isLoading)}>
        {renderBeforeTextBox &&
          cloneElement(renderBeforeTextBox.call(this), onMouseDownProp)}
        <div className={classNames.textBox}>
          {cloneElement(children, {
            onBlur: this.handleBlur,
            onChange: this.handleChange,
            onFocus: this.handleFocus,
            onKeyDown: this.handleKeyDown,
            ref: 'textBox',
            value: value
          })}
          {isMenuVisible && resultList.length > 0 &&
            <div className={classNames.resultList}
              onMouseDown={this.handleMouseDown}>
              {renderBeforeResultList && renderBeforeResultList.call(this)}
              {resultList.map((resultItem, index) => {
                return (
                  <div className={classnames(classNames.resultItem, index === highlightedIndex && classNames.isHighlighted)}
                    key={index}
                    onClick={this.handleResultItemClick.bind(this, index)}>
                    {renderResultItem.call(this, resultItem)}
                  </div>
                );
              })}
              {renderAfterResultList && renderAfterResultList.call(this)}
            </div>}
        </div>
        {renderAfterTextBox &&
          cloneElement(renderAfterTextBox.call(this), onMouseDownProp)}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    highlightedIndex: state.autocomplete.highlightedIndex,
    initialValue: state.autocomplete.initialValue,
    isLoading: state.autocomplete.isLoading,
    isMenuVisible: state.autocomplete.isMenuVisible,
    resultList: state.autocomplete.resultList,
    value: state.autocomplete.value
  };
};

const dispatchers = {
  fetchAutocompleteList,
  hideAutocompleteMenu,
  showAutocompleteMenu,
  resetViewState,
  selectHighlightedItem,
  setInitialValue,
  setValue
};

export default connect(
  mapStateToProps,
  dispatchers
)(Autocomplete);

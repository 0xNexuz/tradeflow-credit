// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TradeFlowCredit
/// @notice Minimal MVP registry for UAE SME invoice finance submissions.
/// @dev The frontend can send raw invoice memo bytes to this contract. The
/// fallback stores those bytes so the current wallet flow remains real without
/// requiring an ABI encoder dependency in the browser.
contract TradeFlowCredit {
    struct InvoiceSubmission {
        address submitter;
        bytes memo;
        uint256 submittedAt;
        uint256 blockNumber;
    }

    InvoiceSubmission[] private submissions;

    event InvoiceSubmitted(
        uint256 indexed invoiceId,
        address indexed submitter,
        bytes memo,
        uint256 submittedAt
    );

    error EmptyMemo();
    error PaymentsNotAccepted();
    error InvoiceNotFound();

    function submitInvoice(bytes calldata memo) external returns (uint256 invoiceId) {
        invoiceId = _submit(memo);
    }

    function invoiceCount() external view returns (uint256) {
        return submissions.length;
    }

    function getInvoice(uint256 invoiceId)
        external
        view
        returns (address submitter, bytes memory memo, uint256 submittedAt, uint256 blockNumber)
    {
        if (invoiceId >= submissions.length) {
            revert InvoiceNotFound();
        }

        InvoiceSubmission storage invoice = submissions[invoiceId];
        return (invoice.submitter, invoice.memo, invoice.submittedAt, invoice.blockNumber);
    }

    fallback() external payable {
        if (msg.value != 0) {
            revert PaymentsNotAccepted();
        }

        _submit(msg.data);
    }

    receive() external payable {
        revert PaymentsNotAccepted();
    }

    function _submit(bytes calldata memo) private returns (uint256 invoiceId) {
        if (memo.length == 0) {
            revert EmptyMemo();
        }

        invoiceId = submissions.length;
        submissions.push(
            InvoiceSubmission({
                submitter: msg.sender,
                memo: memo,
                submittedAt: block.timestamp,
                blockNumber: block.number
            })
        );

        emit InvoiceSubmitted(invoiceId, msg.sender, memo, block.timestamp);
    }
}

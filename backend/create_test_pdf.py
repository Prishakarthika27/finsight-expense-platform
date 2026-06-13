import fitz

doc = fitz.open()
page = doc.new_page()

text = """Bank Statement - Test Account
Account Number: XXXX1234
Period: 01-04-2024 to 30-04-2024

Date        Description                          Amount      Type
01/04/2024  Salary Credit ABC Corp                75000.00    CR
03/04/2024  Swiggy Order Payment                    450.00    DR
05/04/2024  Uber Trip Payment                       320.00    DR
07/04/2024  Amazon Shopping Purchase               2500.00    DR
10/04/2024  Electricity Bill Payment               1800.00    DR
12/04/2024  Netflix Subscription                    499.00    DR
15/04/2024  ATM Withdrawal                         5000.00    DR
18/04/2024  Apollo Pharmacy Payment                 650.00    DR
20/04/2024  Refund from Flipkart                   1200.00    CR
22/04/2024  Zomato Order Payment                    380.00    DR
25/04/2024  Petrol Pump Payment                    2000.00    DR
28/04/2024  Interest Credit                         150.00    CR
"""

page.insert_text((50, 50), text, fontsize=10, fontname="helv")
doc.save("test_statement.pdf")
print("Created test_statement.pdf")
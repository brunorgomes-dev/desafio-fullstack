import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('app bootstrap renders', (WidgetTester tester) async {
    await tester.pumpWidget(const DesafioMobileApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}

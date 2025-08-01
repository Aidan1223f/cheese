import { Colors } from '@/constants/Colors';
import { supabase } from '@/constants/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSupabase } from '@/hooks/useSupabase';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PRODUCT_TYPES = ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'];

export default function InputProductsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useSupabase();
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState(PRODUCT_TYPES[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Error', error.message);
    else setProducts(data || []);
    setLoading(false);
  };

  const addProduct = async () => {
    if (!user || !name.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('user_products').insert({
      user_id: user.id,
      name,
      type,
    });
    if (error) Alert.alert('Error', error.message);
    setName('');
    setType(PRODUCT_TYPES[0]);
    fetchProducts();
    setLoading(false);
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('user_products').delete().eq('id', id);
    if (error) Alert.alert('Error', error.message);
    fetchProducts();
    setLoading(false);
  };

  if (!user) {
    return <View style={[styles.container, { backgroundColor: Colors.light.background }]}><Text style={{ color: Colors.light.text, textAlign: 'center', marginTop: 32 }}>Please sign in to manage your products.</Text></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}> 
      <Text style={[styles.title, { color: Colors.light.text }]}>Your Products</Text>
      <View style={styles.form}>
        <TextInput
          style={[styles.input, { color: Colors.light.text, borderColor: Colors.light.tint }]}
          placeholder="Product Name"
          placeholderTextColor={Colors.light.text + '80'}
          value={name}
          onChangeText={setName}
        />
        <View style={styles.typeRow}>
          {PRODUCT_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeButton, 
                type === t && { 
                  backgroundColor: Colors.light.tint, 
                  borderColor: Colors.light.tint 
                }
              ]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeButtonText, type === t ? styles.typeButtonTextSelected : null]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: Colors.light.tint }]} 
          onPress={addProduct} 
          disabled={loading}
        >
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            <Text style={[styles.productName, { color: Colors.light.text }]}>{item.name} ({item.type})</Text>
            <TouchableOpacity onPress={() => deleteProduct(item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: Colors.light.text, textAlign: 'center', marginTop: 32 }}>No products yet.</Text>}
        refreshing={loading}
        onRefresh={fetchProducts}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center', lineHeight: 34 },
  form: { marginBottom: 32 },
  input: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  typeButton: { 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonSelected: { borderColor: '#8FAE8B' },
  typeButtonText: { color: '#424242', fontWeight: '500' },
  typeButtonTextSelected: { color: '#fff', fontWeight: '600' },
  addButton: { 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 18 },
  productRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: { fontSize: 16, fontWeight: '500', color: '#424242' },
  deleteText: { color: '#FF6B6B', fontWeight: '600' },
}); 
